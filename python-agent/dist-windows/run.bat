@echo off
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python gui.py
) else (
    echo [ERROR] Please run launcher.bat first to setup virtual environment
    pause
)
