#!/bin/bash
set -euo pipefail

# Antra - Multi-Site Ubuntu Server Production Setup Script
# Designed for servers hosting multiple sites under /var/www/websites/
# Usage: sudo bash deploy/setup-ubuntu.sh <DOMAIN_OR_IP> [APP_PORT]
# Example: sudo bash deploy/setup-ubuntu.sh antra.yourdomain.com 3001

DOMAIN_OR_IP="${1:-_}"
APP_PORT="${2:-3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==================================================="
echo "  Antra Multi-Site Ubuntu Production Setup"
echo "  App Directory: $APP_DIR"
echo "  Server Name:   $DOMAIN_OR_IP"
echo "  Internal Port: $APP_PORT"
echo "==================================================="

# 1. Check if requested port is already used by website1/website2
if ss -tln | grep -q ":${APP_PORT} "; then
  echo "WARNING: Port $APP_PORT is already in use by another app!"
  echo "Check active ports with: ss -tulpn"
  echo "Re-run with a free port, e.g.: sudo bash deploy/setup-ubuntu.sh $DOMAIN_OR_IP 3002"
  exit 1
fi

# 2. Ensure required packages (non-destructive if already installed)
apt-get update
apt-get install -y curl gnupg ca-certificates postgresql postgresql-contrib nginx

# 3. Install Node.js 20 LTS if Node < 18
NEED_NODE=0
if ! command -v node >/dev/null 2>&1; then
  NEED_NODE=1
else
  NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 18 ]; then
    NEED_NODE=1
  fi
fi

if [ "$NEED_NODE" -eq 1 ]; then
  echo "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "Using Node: $(node -v), npm: $(npm -v)"

# 4. Ensure PostgreSQL is running & database from .env exists (without altering existing users/other DBs)
systemctl enable postgresql
systemctl start postgresql

if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$APP_DIR/.env"
  set +a
fi

DB_USER="${PGUSER:-postgres}"
DB_PASS="${PGPASSWORD:-cepl@123}"
DB_PASS_SQL="${DB_PASS//\'/\'\'}"
DB_NAME="${PGDATABASE:-company_database}"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER \"$DB_USER\" WITH SUPERUSER PASSWORD '$DB_PASS_SQL';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"

# 5. Install dependencies & build production Next.js app
cd "$APP_DIR"
npm install
npm run build

# 6. Start / restart Antra with PM2 on APP_PORT (without touching other PM2 apps)
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 delete antra >/dev/null 2>&1 || true
PORT="$APP_PORT" pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
pm2 save

RUN_USER="${SUDO_USER:-root}"
RUN_HOME="$(eval echo "~$RUN_USER")"
env PATH="$PATH:/usr/bin:/usr/local/bin" pm2 startup systemd -u "$RUN_USER" --hp "$RUN_HOME" || true

# 7. Add Nginx site config for Antra (without removing website1/website2 configs)
sed -e "s/YOUR_DOMAIN_OR_IP/$DOMAIN_OR_IP/g" \
    -e "s/APP_PORT/$APP_PORT/g" \
    "$APP_DIR/deploy/nginx-antra.conf" > /etc/nginx/sites-available/antra
ln -sf /etc/nginx/sites-available/antra /etc/nginx/sites-enabled/antra
nginx -t
systemctl reload nginx

echo "==================================================="
echo "  Antra Live Setup Complete!"
echo "  Directory: $APP_DIR"
echo "  PM2 App:   antra (127.0.0.1:$APP_PORT)"
echo "  Nginx:     /etc/nginx/sites-available/antra ($DOMAIN_OR_IP)"
echo ""
echo "  NEXT STEP (HTTPS for Login Cookies + Camera):"
echo "  sudo certbot --nginx -d $DOMAIN_OR_IP"
echo "==================================================="
