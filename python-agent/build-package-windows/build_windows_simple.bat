@echo off
REM AutoAIphone Agent - Build Windows EXE
REM Script đơn giản, tương tự build_macos.sh

echo ========================================
echo AutoAIphone Agent - Windows Build
echo ========================================
echo.

cd /d "%~dp0"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.11+
    pause
    exit /b 1
)

echo [INFO] Python found
python --version
echo.

REM Step 1: Setup venv
echo [1/4] Setting up virtual environment...
if exist "venv_windows" rmdir /s /q venv_windows
python -m venv venv_windows
call venv_windows\Scripts\activate.bat
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
pip install pyinstaller -q
echo ✅ Virtual environment ready
echo.

REM Step 2: Build exe
echo [2/4] Building executable...
REM Use existing spec file or create one
if exist "pyinstaller_gui.spec" (
    pyinstaller pyinstaller_gui.spec --clean --distpath dist-windows --workpath build-windows
) else (
    echo [ERROR] pyinstaller_gui.spec not found!
    pause
    exit /b 1
)

if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo ✅ Executable built
echo.

REM Step 3: Copy venv and config
echo [3/4] Copying files...
if exist "dist-windows\venv" rmdir /s /q dist-windows\venv
xcopy /E /I /Y venv_windows dist-windows\venv >nul
xcopy /E /I /Y config dist-windows\config >nul
echo ✅ Files copied
echo.

REM Step 4: Create zip
echo [4/4] Creating distribution package...
cd dist-windows
powershell Compress-Archive -Path AutoAIphoneAgent.exe,venv,config -DestinationPath AutoAIphoneAgent-Windows.zip -Force
cd ..
echo ✅ Zip created: dist-windows\AutoAIphoneAgent-Windows.zip
echo.

REM Cleanup
if exist "venv_windows" rmdir /s /q venv_windows
if exist "build-windows" rmdir /s /q build-windows
echo ✅ Cleanup completed
echo.

echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo 📦 File exe: dist-windows\AutoAIphoneAgent.exe
echo 📦 Zip file: dist-windows\AutoAIphoneAgent-Windows.zip
echo.
pause

