@echo off
TITLE School Management System - Server
COLOR 0A

echo =========================================================================
echo            SCHOOL MANAGEMENT SYSTEM (SMS) - APPLICATION
echo   Developer: Rafiq Haqyar (Contact: 923229594616)
echo   Local Address: http://localhost:3000
echo =========================================================================
echo.
echo Starting application server...
echo.

:: Open the browser after 2 seconds in parallel
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"

:: Start the Node server
node server/server.js

pause
