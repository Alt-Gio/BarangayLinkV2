@echo off
echo ========================================
echo  BarangayLink V2 - Quick Start Guide
echo ========================================
echo.
echo This script will help you set up your app after cloning from Git.
echo.
echo ========================================
echo  Step 1: Checking Dependencies
echo ========================================
echo.

if not exist "node_modules\" (
    echo [!] node_modules not found. Installing dependencies...
    call npm install
    echo [OK] Dependencies installed!
) else (
    echo [OK] Dependencies already installed.
)

echo.
echo ========================================
echo  Step 2: Checking Environment File
echo ========================================
echo.

if not exist ".env.local" (
    echo [!] .env.local file NOT FOUND!
    echo.
    echo IMPORTANT: You need to create .env.local file with your API keys.
    echo.
    echo Please follow these steps:
    echo 1. Create a file named .env.local in the project root
    echo 2. Copy the contents from env.template
    echo 3. Replace placeholder values with your actual API keys
    echo.
    echo Required keys:
    echo - NEXT_PUBLIC_CONVEX_URL
    echo - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    echo - CLERK_SECRET_KEY
    echo - LIVEBLOCKS_SECRET_KEY
    echo - NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
    echo.
    pause
) else (
    echo [OK] .env.local file found!
)

echo.
echo ========================================
echo  Step 3: Next Steps
echo ========================================
echo.
echo To start your development servers, you need TWO terminal windows:
echo.
echo Terminal 1 - Convex Backend:
echo   npx convex dev
echo.
echo Terminal 2 - Next.js Frontend:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo ========================================
echo  Firefox-Specific Setup
echo ========================================
echo.
echo If using Firefox:
echo 1. Go to about:config
echo 2. Enable: dom.serviceWorkers.enabled
echo 3. Clear Firefox cache
echo 4. Disable Tracking Protection for localhost
echo.
echo For detailed instructions, see:
echo - FIREFOX_FIX_AND_SETUP_GUIDE.md
echo - SETUP_CHECKLIST.md
echo.
echo ========================================
echo  Ready to Start?
echo ========================================
echo.
echo Press any key to open documentation files...
pause > nul

start SETUP_CHECKLIST.md
start FIREFOX_FIX_AND_SETUP_GUIDE.md

echo.
echo Documentation opened! Follow the guides to complete setup.
echo.
pause
