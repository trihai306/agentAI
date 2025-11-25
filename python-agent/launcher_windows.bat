@echo off
REM AutoAIphone Agent - Windows Launcher
REM Simple launcher script for Windows

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check if venv exists
if not exist "venv" (
    echo [INFO] Virtual environment not found. Running installer...
    python installer.py
    if errorlevel 1 (
        echo [ERROR] Installer failed!
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if dependencies are installed
python -c "import openai.agents" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Dependencies not found. Installing...
    pip install -r requirements.txt
)

REM Start agent
echo [INFO] Starting AutoAIphone Agent...
echo.
python main.py

pause

