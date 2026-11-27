const path = require('path');

const port = process.env.PORT || 3000;

module.exports = {
  apps: [
    {
      name: 'antra',
      script: 'node_modules/next/dist/bin/next',
      args: `start -H 127.0.0.1 -p ${port}`,
      cwd: path.resolve(__dirname, '..'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: port
      }
    }
  ]
};
