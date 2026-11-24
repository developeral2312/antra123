#!/bin/bash
# Antra Development Mode (Hot Reload)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$SCRIPT_DIR/.tools/node/bin:$PATH"

echo "==================================================="
echo "   🛠️  Starting Antra in Development Mode"
echo "==================================================="
echo "Server will run on http://localhost:3000"
echo "Login: admin@antra.com / admin123"
echo "==================================================="

cd "$SCRIPT_DIR"
npx next dev -H 0.0.0.0 -p 3000
