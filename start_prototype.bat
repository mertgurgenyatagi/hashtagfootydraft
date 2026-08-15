@echo off
title footydraft prototype
cd /d "%~dp0"

python --version >nul 2>&1
if errorlevel 1 (
  echo Python was not found on PATH.
  pause
  exit /b 1
)

echo Starting #footydraft prototype... a browser tab will open at http://localhost:8777
echo Close this window or press Ctrl+C to stop the server.
echo.

python -u -m prototype.server

echo.
echo Server stopped.
pause
