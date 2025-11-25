#!/bin/bash
# AutoAIphone Agent - Build Windows Package từ macOS/Linux
# Build vào thư mục riêng: dist-windows/
# Package này có thể chạy trên Windows với Python
#
# LƯU Ý: Script này tạo package Python (có source code)
# Để build .exe (không lộ source), dùng: ./build_windows_exe.sh

set -e

echo "========================================"
echo "AutoAIphone Agent - Windows Package Build"
echo "========================================"
echo ""
echo "⚠️  LƯU Ý: Script này tạo package Python (có source code)"
echo "💡 Để build .exe (không lộ source), dùng: ./build_windows_exe.sh"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 not found! Please install Python 3.8+"
    exit 1
fi

echo "[INFO] Python found"
python3 --version

# Step 1: Clean and create dist-windows directory
echo ""
echo "[1/5] Preparing dist-windows directory..."
if [ -d "dist-windows" ]; then
    echo "[INFO] Removing existing dist-windows..."
    rm -rf dist-windows
fi
mkdir -p dist-windows
echo "✅ Directory created"

# Step 2: Copy source files
echo ""
echo "[2/5] Copying source files..."
cp gui.py dist-windows/
cp installer.py dist-windows/
cp main.py dist-windows/
cp requirements.txt dist-windows/

# Copy directories
cp -r agent dist-windows/
cp -r config dist-windows/

echo "✅ Source files copied"

# Step 3: Create Windows launcher script
echo ""
echo "[3/5] Creating Windows launcher scripts..."

# Create launcher.bat
cat > dist-windows/launcher.bat << 'EOF'
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
EOF

# Create run.bat (simple launcher)
cat > dist-windows/run.bat << 'EOF'
@echo off
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python gui.py
) else (
    echo [ERROR] Please run launcher.bat first to setup virtual environment
    pause
)
EOF

# Create README for Windows users
cat > dist-windows/README_WINDOWS.txt << 'EOF'
========================================
AutoAIphone Agent - Windows Installation
========================================

CÁCH 1: Chạy tự động (Khuyến nghị)
----------------------------------
1. Double-click vào file: launcher.bat
2. Script sẽ tự động:
   - Tạo virtual environment (nếu chưa có)
   - Cài đặt dependencies
   - Chạy ứng dụng

Yêu cầu:
- Python 3.8+ đã được cài đặt
- Python đã được thêm vào PATH

CÁCH 2: Chạy thủ công
---------------------
1. Mở Command Prompt hoặc PowerShell
2. Di chuyển vào thư mục này:
   cd path\to\dist-windows
3. Tạo virtual environment:
   python -m venv venv
4. Kích hoạt venv:
   venv\Scripts\activate
5. Cài đặt dependencies:
   pip install -r requirements.txt
6. Chạy ứng dụng:
   python gui.py

CÁCH 3: Sử dụng run.bat (nếu đã setup venv)
-------------------------------------------
1. Đảm bảo đã chạy launcher.bat ít nhất 1 lần
2. Double-click vào: run.bat

LƯU Ý:
------
- Lần đầu chạy sẽ mất vài phút để cài đặt dependencies
- Cần kết nối internet để tải dependencies
- Ứng dụng sẽ tự động cài đặt ADB nếu chưa có

HỖ TRỢ:
-------
Nếu gặp lỗi, vui lòng kiểm tra:
1. Python đã được cài đặt: python --version
2. Python đã được thêm vào PATH
3. Kết nối internet ổn định
EOF

echo "✅ Launcher scripts created"

# Step 4: Create setup script for Windows
echo ""
echo "[4/5] Creating setup script..."

cat > dist-windows/setup.bat << 'EOF'
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
EOF

echo "✅ Setup script created"

# Step 5: Create distribution zip
echo ""
echo "[5/5] Creating distribution zip..."
cd dist-windows
zip -r AutoAIphoneAgent-Windows.zip . > /dev/null
cd ..
echo "✅ Zip created: dist-windows/AutoAIphoneAgent-Windows.zip"

# Display summary
echo ""
echo "========================================"
echo "Windows Package Build completed successfully!"
echo "========================================"
echo ""
echo "📦 Distribution package ready in: dist-windows/"
echo ""
echo "Contents:"
echo "  - gui.py, installer.py, main.py (source files)"
echo "  - agent/ (agent package)"
echo "  - config/ (configuration files)"
echo "  - requirements.txt (dependencies)"
echo "  - launcher.bat (auto setup and run)"
echo "  - run.bat (quick launcher)"
echo "  - setup.bat (manual setup)"
echo "  - README_WINDOWS.txt (instructions)"
echo "  - AutoAIphoneAgent-Windows.zip (distribution package)"
echo ""
echo "📋 For Windows users:"
echo "   1. Extract AutoAIphoneAgent-Windows.zip"
echo "   2. Double-click: launcher.bat"
echo "   3. App will auto-setup and run"
echo ""
echo "⚠️  Note: Users need Python 3.8+ installed on Windows"
echo ""

