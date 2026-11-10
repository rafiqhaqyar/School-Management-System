@echo off
TITLE School Management System - One-Click Installer
COLOR 0B

echo =========================================================================
echo            SCHOOL MANAGEMENT SYSTEM (SMS) - INSTALLER
echo   Currency: PKR (Pakistani Rupee)
echo   Developer: Rafiq Haqyar (Contact: 923229594616, rafiqhaqyar524@gmail.com)
echo =========================================================================
echo.

:: 1. Check if Node.js is installed
echo [1/4] Checking Node.js runtime...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    echo [ERROR] Node.js is NOT installed on this computer!
    echo Please download and install Node.js (LTS version) from:
    echo   https://nodejs.org
    echo After installing Node.js, run this install.bat again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   Found Node.js %NODE_VER% - OK!
echo.

:: 2. Ensure .env configuration file exists
echo [2/4] Verifying environment configuration (.env)...
if not exist ".env" (
    echo   Creating default .env configuration...
    (
        echo PORT=3000
        echo NODE_ENV=development
        echo DB_HOST=127.0.0.1
        echo DB_PORT=3306
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=school-management-system
    ) > .env
    echo   Created .env with default MySQL settings (root / no password).
) else (
    echo   Existing .env configuration found - OK!
)
echo.

:: 3. Install NPM dependencies
echo [3/4] Installing / Verifying project dependencies...
if not exist "node_modules\" (
    echo   Installing npm packages (express, mysql2, etc.)...
    call npm install
) else (
    echo   Dependencies already installed - OK!
)
echo.

:: 4. Auto-setup and attach database
echo [4/4] Setting up attached database and initial data...
call node server/setup-db.js
if %ERRORLEVEL% NEQ 0 (
    COLOR 0E
    echo.
    echo [WARNING] Could not automatically connect to MySQL server.
    echo If your MySQL has a password or custom port, edit the ".env" file.
    echo You can also import "database/schema.sql" directly via phpMyAdmin.
    echo.
    pause
    exit /b 1
)

COLOR 0A
echo.
echo =========================================================================
echo                 INSTALLATION COMPLETED SUCCESSFULLY!
echo =========================================================================
echo.
echo  Default Login Accounts:
echo    - Administrator: username: admin     / password: admin123
echo    - Principal:     username: principal / password: principal123
echo    - Teacher:       username: teacher   / password: teacher123
echo    - Student:       username: student   / password: student123
echo.
echo  To start the application anytime, double-click: start.bat
echo.

set /p START_NOW="Do you want to start the School Management System now? (Y/N): "
if /i "%START_NOW%"=="Y" (
    call start.bat
) else (
    echo You can start the server whenever you are ready using "start.bat" or "npm start".
    pause
)
