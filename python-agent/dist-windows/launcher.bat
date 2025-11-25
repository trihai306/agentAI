@echo off
REM AutoAIphone Agent Launcher for Windows
REM Sử dụng venv có sẵn hoặc tạo mới

cd /d "%~dp0"

REM Check if venv exists
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating existing virtual environment...
    call venv\Scripts\activate.bat
    python gui.py
) else (
    echo [INFO] Virtual environment not found. Creating new one...
    echo [INFO] This may take a few minutes...

    REM Check Python
    python --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found! Please install Python 3.8+ from https://www.python.org/
        echo [ERROR] Make sure to check "Add Python to PATH" during installation
        pause
        exit /b 1
    )

    REM Create venv
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )

    REM Activate and install dependencies
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip -q
    pip install -r requirements.txt -q

    echo [INFO] Virtual environment ready!
    python gui.py
)
