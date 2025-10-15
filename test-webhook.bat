@echo off
echo ============================================
echo Messenger Webhook Tester
echo ============================================
echo.
echo Please enter your Convex deployment URL:
echo (Example: https://happy-animal-123.convex.site)
set /p CONVEX_URL="Convex URL: "

echo.
echo Please enter your verify token:
set /p VERIFY_TOKEN="Verify Token: "

echo.
echo Testing webhook at: %CONVEX_URL%/messenger-webhook
echo.

curl "%CONVEX_URL%/messenger-webhook?hub.mode=subscribe&hub.verify_token=%VERIFY_TOKEN%&hub.challenge=test_challenge"

echo.
echo.
echo ============================================
echo Expected Result: test_challenge
echo ============================================
echo.
echo If you see "test_challenge" above, your webhook is working!
echo If you see "Forbidden", your verify token doesn't match.
echo.
pause
