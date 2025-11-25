@echo off
REM AutoAIphone Agent - Windows Build Script
REM This script builds the agent for Windows

echo ========================================
echo AutoAIphone Agent - Windows Build
echo ========================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [INFO] Python found
python --version

REM Create virtual environment if not exists
if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install build dependencies
echo [INFO] Installing build dependencies...
pip install pyinstaller

REM Install project dependencies
echo [INFO] Installing project dependencies...
pip install -r requirements.txt

REM Build with PyInstaller
echo [INFO] Building executable...
pyinstaller --name="AutoAIphoneAgent" ^
    --onefile ^
    --windowed ^
    --icon=NONE ^
    --add-data "config;config" ^
    --hidden-import=uvicorn.lifespan.on ^
    --hidden-import=uvicorn.lifespan.off ^
    --hidden-import=uvicorn.protocols.websockets.auto ^
    --hidden-import=uvicorn.protocols.http.auto ^
    --hidden-import=uvicorn.loops.auto ^
    --hidden-import=uvicorn.logging ^
    --collect-all=openai.agents ^
    --collect-all=fastapi ^
    --collect-all=uvicorn ^
    main.py

if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Executable location: dist\AutoAIphoneAgent.exe
echo.
echo You can now:
echo 1. Run dist\AutoAIphoneAgent.exe to start the agent
echo 2. Or use installer.py for GUI installation
echo.
pause

