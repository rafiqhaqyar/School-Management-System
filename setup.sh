#!/bin/bash
# School Management System - Installer Script for Linux / macOS
# Developer: Rafiq Haqyar (Email: rafiqhaqyar524@gmail.com)

echo "========================================================================="
echo "           SCHOOL MANAGEMENT SYSTEM (SMS) - INSTALLER"
echo "  Developer: Rafiq Haqyar (Contact: 923229594616)"
echo "========================================================================="
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is NOT installed! Please install Node.js (v18+) from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# 2. Check .env
if [ ! -f .env ]; then
    echo "Creating default .env configuration..."
    cat <<EOT >> .env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=school-management-system
EOT
fi

# 3. Install packages
echo "Installing dependencies..."
npm install

# 4. Run database setup
echo "Initializing attached database..."
node server/setup-db.js

echo ""
echo "========================================================================="
echo "✅ Installation Complete! Run './start.sh' or 'npm start' to begin."
echo "========================================================================="
