@echo off
echo ========================================
echo   Family Dashboard - Quick Start
echo ========================================
echo.

REM Create directories if they don't exist
if not exist "public\photos" mkdir "public\photos"
if not exist "public\backgrounds" mkdir "public\backgrounds"

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo   https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo Starting Family Dashboard with Docker...
echo.
echo The dashboard will be available at:
echo   http://localhost:3000
echo.
echo To add photos, put image files in the public\photos folder.
echo.
echo Press Ctrl+C to stop the server.
echo.

docker compose up --build

echo.
echo Closing Family Dashboard...
pause