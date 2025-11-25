#!/bin/bash
# AutoAIphone Agent - Build macOS với Venv Đầy Đủ
# Build vào thư mục riêng: dist-macos/

set -e

echo "========================================"
echo "AutoAIphone Agent - macOS Build"
echo "========================================"
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

# Step 1: Create and setup venv with all dependencies
echo ""
echo "[1/4] Setting up virtual environment with all dependencies..."
# Clean up old venv if exists
if [ -d "venv_macos" ]; then
    echo "[INFO] Removing existing venv_macos..."
    rm -rf venv_macos
fi

echo "[INFO] Creating virtual environment..."
python3 -m venv venv_macos

echo "[INFO] Activating virtual environment..."
source venv_macos/bin/activate

echo "[INFO] Upgrading pip..."
python -m pip install --upgrade pip -q

echo "[INFO] Installing all dependencies (this may take a few minutes)..."
pip install -r requirements.txt -q

echo "[INFO] Installing pyinstaller..."
pip install pyinstaller -q

echo "✅ Virtual environment ready with all dependencies"

# Step 2: Build exe
echo ""
echo "[2/4] Building executable..."
# Create spec file for macOS build
cat > pyinstaller_macos.spec << 'EOF'
# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for macOS GUI version

block_cipher = None

a = Analysis(
    ['gui.py', 'installer.py', 'main.py'],  # Include all main files
    pathex=[],
    binaries=[],
    datas=[
        ('config', 'config'),
        ('agent', 'agent'),  # Include entire agent package
    ],
    hiddenimports=[
        'tkinter',
        'tkinter.ttk',
        '_tkinter',
        'webbrowser',
        'threading',
        'subprocess',
        'pathlib',
        'installer',
        'installer.AgentInstaller',
        # Include main and agent modules
        'main',
        'agent',
        'agent.adb',
        'agent.adb.adb_client',
        'agent.adb.adb_installer',
        'agent.server',
        'agent.server.http_server',
        'agent.server.websocket_server',
        'agent.ui_automator',
        'asyncio',
        'yaml',
        'fastapi',
        'uvicorn',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AutoAIphoneAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
EOF

pyinstaller pyinstaller_macos.spec --clean --distpath dist-macos --workpath build-macos

if [ $? -ne 0 ]; then
    echo "[ERROR] Build failed!"
    exit 1
fi

# Step 3: Copy venv to dist-macos
echo ""
echo "[3/4] Copying venv to dist-macos folder..."
if [ -d "dist-macos/venv" ]; then
    rm -rf dist-macos/venv
fi
cp -r venv_macos dist-macos/venv
echo "✅ Venv copied to dist-macos/venv"

# Step 4: Copy config
echo ""
echo "[4/4] Copying config and creating launcher..."
if [ -d "dist-macos/config" ]; then
    rm -rf dist-macos/config
fi
cp -r config dist-macos/config

# Create launcher script
cat > dist-macos/launcher.sh << 'EOF'
#!/bin/bash
# AutoAIphone Agent Launcher
# Sử dụng venv có sẵn

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
    python gui.py
else
    echo "[ERROR] venv not found! Please run installer."
    ./AutoAIphoneAgent
fi
EOF
chmod +x dist-macos/launcher.sh
echo "✅ Launcher script created"

# Create zip
echo ""
echo "[5/5] Creating distribution zip..."
cd dist-macos
zip -r AutoAIphoneAgent-macOS.zip AutoAIphoneAgent venv config launcher.sh > /dev/null
cd ..
echo "✅ Zip created: dist-macos/AutoAIphoneAgent-macOS.zip"

# Clean up build venv (optional - comment out if you want to keep it for faster rebuilds)
echo ""
echo "[6/6] Cleaning up build files..."
if [ -d "venv_macos" ]; then
    echo "[INFO] Removing build venv (venv_macos)..."
    rm -rf venv_macos
fi
if [ -d "build-macos" ]; then
    echo "[INFO] Removing build cache..."
    rm -rf build-macos
fi
echo "✅ Cleanup completed"

echo ""
echo "========================================"
echo "macOS Build completed successfully!"
echo "========================================"
echo ""
echo "📦 Distribution package ready in: dist-macos/"
echo ""
echo "Contents:"
echo "  - AutoAIphoneAgent (executable)"
echo "  - venv/ (pre-installed virtual environment)"
echo "  - config/ (configuration files)"
echo "  - launcher.sh (optional launcher)"
echo "  - AutoAIphoneAgent-macOS.zip (distribution package)"
echo ""
echo "Users can now:"
echo "  1. Run: ./AutoAIphoneAgent"
echo "  2. Or: ./launcher.sh"
echo "  3. Only need to install ADB (will auto-install)"
echo ""

