@echo off
cd /d "%~dp0"
echo ===================================================
echo    Starting Antra Production Server
echo ===================================================
echo Server URL: http://localhost:3000
echo Admin Login: admin@antra.com / admin123
echo ===================================================
npm run start
pause
