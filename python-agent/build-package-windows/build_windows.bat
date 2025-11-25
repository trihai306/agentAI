@echo off
REM AutoAIphone Agent - Build Windows với Venv Đầy Đủ
REM Build vào thư mục riêng: dist-windows\

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

REM Step 1: Create and setup venv with all dependencies
echo.
echo [1/4] Setting up virtual environment with all dependencies...
if exist "venv_windows" (
    echo [INFO] Removing existing venv_windows...
    rmdir /s /q venv_windows
)

echo [INFO] Creating virtual environment...
python -m venv venv_windows
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv_windows\Scripts\activate.bat

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip -q

echo [INFO] Installing all dependencies (this may take a few minutes)...
pip install -r requirements.txt -q

echo [INFO] Installing pyinstaller...
pip install pyinstaller -q

echo ✅ Virtual environment ready with all dependencies

REM Step 2: Build exe
echo.
echo [2/4] Building executable...
REM Create spec file for Windows build
(
echo # -*- mode: python ; coding: utf-8 -*-
echo # PyInstaller spec file for Windows GUI version
echo.
echo block_cipher = None
echo.
echo a = Analysis(
echo     ['gui.py', 'installer.py', 'main.py'],  # Include all main files
echo     pathex=[],
echo     binaries=[],
echo     datas=[
echo         ('config', 'config'),
echo         ('agent', 'agent'),  # Include entire agent package
echo     ],
echo     hiddenimports=[
echo         'tkinter',
echo         'tkinter.ttk',
echo         '_tkinter',
echo         'webbrowser',
echo         'threading',
echo         'subprocess',
echo         'pathlib',
echo         'installer',
echo         'installer.AgentInstaller',
echo         # Include main and agent modules
echo         'main',
echo         'agent',
echo         'agent.adb',
echo         'agent.adb.adb_client',
echo         'agent.adb.adb_installer',
echo         'agent.server',
echo         'agent.server.http_server',
echo         'agent.server.websocket_server',
echo         'agent.ui_automator',
echo         'asyncio',
echo         'yaml',
echo         'fastapi',
echo         'uvicorn',
echo     ],
echo     hookspath=[],
echo     hooksconfig={},
echo     runtime_hooks=[],
echo     excludes=[],
echo     win_no_prefer_redirects=False,
echo     win_private_assemblies=False,
echo     cipher=block_cipher,
echo     noarchive=False,
echo )
echo.
echo pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
echo.
echo exe = EXE(
echo     pyz,
echo     a.scripts,
echo     a.binaries,
echo     a.zipfiles,
echo     a.datas,
echo     [],
echo     name='AutoAIphoneAgent',
echo     debug=False,
echo     bootloader_ignore_signals=False,
echo     strip=False,
echo     upx=True,
echo     upx_exclude=[],
echo     runtime_tmpdir=None,
echo     console=False,
echo     disable_windowed_traceback=False,
echo     argv_emulation=False,
echo     target_arch=None,
echo     codesign_identity=None,
echo     entitlements_file=None,
echo     icon=None,
echo )
) > pyinstaller_windows.spec

venv_windows\Scripts\activate.bat
pyinstaller pyinstaller_windows.spec --clean --distpath dist-windows --workpath build-windows
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

REM Step 3: Copy venv to dist-windows
echo.
echo [3/4] Copying venv to dist-windows folder...
if exist "dist-windows\venv" (
    rmdir /s /q dist-windows\venv
)
xcopy /E /I /Y venv_windows dist-windows\venv
echo ✅ Venv copied to dist-windows\venv

REM Step 4: Copy config and create launcher
echo.
echo [4/4] Copying config and creating launcher...
if exist "dist-windows\config" (
    rmdir /s /q dist-windows\config
)
xcopy /E /I /Y config dist-windows\config

REM Create launcher script
(
echo @echo off
echo REM AutoAIphone Agent Launcher
echo REM Sử dụng venv có sẵn
echo.
echo cd /d "%%~dp0"
echo.
echo REM Activate venv
echo if exist "venv" ^(
echo     call venv\Scripts\activate.bat
echo     python gui.py
echo ^) else ^(
echo     echo [ERROR] venv not found! Please run installer.
echo     AutoAIphoneAgent.exe
echo ^)
) > dist-windows\launcher.bat
echo ✅ Launcher script created

REM Create zip
echo.
echo [5/5] Creating distribution zip...
cd dist-windows
powershell Compress-Archive -Path AutoAIphoneAgent.exe,venv,config,launcher.bat -DestinationPath AutoAIphoneAgent-Windows.zip -Force
cd ..
echo ✅ Zip created: dist-windows\AutoAIphoneAgent-Windows.zip

REM Clean up build venv (optional - comment out if you want to keep it for faster rebuilds)
echo.
echo [6/6] Cleaning up build files...
if exist "venv_windows" (
    echo [INFO] Removing build venv (venv_windows)...
    rmdir /s /q venv_windows
)
if exist "build-windows" (
    echo [INFO] Removing build cache...
    rmdir /s /q build-windows
)
echo ✅ Cleanup completed

echo.
echo ========================================
echo Windows Build completed successfully!
echo ========================================
echo.
echo 📦 Distribution package ready in: dist-windows\
echo.
echo Contents:
echo   - AutoAIphoneAgent.exe (executable)
echo   - venv\ (pre-installed virtual environment)
echo   - config\ (configuration files)
echo   - launcher.bat (optional launcher)
echo   - AutoAIphoneAgent-Windows.zip (distribution package)
echo.
echo Users can now:
echo   1. Run: AutoAIphoneAgent.exe
echo   2. Or: launcher.bat
echo   3. Only need to install ADB (will auto-install)
echo.
pause

