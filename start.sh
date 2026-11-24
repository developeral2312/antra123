#!/bin/bash
# Antra Application Startup Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$SCRIPT_DIR/.tools/node/bin:$PATH"

echo "==================================================="
echo "   🚀 Starting Antra - Customer Management System"
echo "==================================================="
echo "Node version: $(node -v)"
echo "Starting server on http://localhost:3000 ..."
echo ""
echo "🔑 Login Credentials:"
echo "   Email:    admin@antra.com"
echo "   Password: admin123"
echo "==================================================="

cd "$SCRIPT_DIR"
npx next start -H 0.0.0.0 -p 3000
