@echo off
echo === Farm Inventory App Local Setup ===
echo.

if not exist node_modules (
  echo First run detected. Installing dependencies...
  call npm install
  if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
  )
)

echo Starting the server...
echo The app will try to connect to the remote database
echo If that fails, it will fall back to in-memory storage
echo.
echo Press Ctrl+C to stop the server
echo.

node local-setup\server.js
pause