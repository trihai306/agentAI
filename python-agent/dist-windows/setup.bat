@echo off
REM AutoAIphone Agent - Setup Script for Windows
REM Tạo venv và cài đặt dependencies

echo ========================================
echo AutoAIphone Agent - Setup
echo ========================================
echo.

cd /d "%~dp0"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo [ERROR] Please install Python 3.8+ from https://www.python.org/
    echo [ERROR] Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo [INFO] Python found
python --version
echo.

REM Remove old venv if exists
if exist "venv" (
    echo [INFO] Removing existing venv...
    rmdir /s /q venv
)

REM Create venv
echo [INFO] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate venv
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip -q

REM Install dependencies
echo [INFO] Installing dependencies (this may take a few minutes)...
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo You can now run the application:
echo   1. Double-click: launcher.bat
echo   2. Or: run.bat (if venv is already setup)
echo.
pause
