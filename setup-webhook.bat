@echo off
echo Setting up Messenger Webhook Environment Variable
echo.
echo Please enter your verify token (or press Enter to use default):
set /p VERIFY_TOKEN="Verify Token: "
if "%VERIFY_TOKEN%"=="" set VERIFY_TOKEN=barangaylink_verify_2024_secure

echo.
echo Setting MESSENGER_VERIFY_TOKEN=%VERIFY_TOKEN%
npx convex env set MESSENGER_VERIFY_TOKEN "%VERIFY_TOKEN%"

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Your verify token is: %VERIFY_TOKEN%
echo.
echo IMPORTANT: Use this EXACT token in Facebook's webhook setup!
echo Write it down somewhere safe.
echo.
pause
