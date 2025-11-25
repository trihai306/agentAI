#!/bin/bash
# AutoAIphone Agent - macOS Build Script
# This script builds the agent for macOS

set -e

echo "========================================"
echo "AutoAIphone Agent - macOS Build"
echo "========================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 not found! Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

echo "[INFO] Python found"
python3 --version

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "[INFO] Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "[INFO] Upgrading pip..."
python -m pip install --upgrade pip

# Install build dependencies
echo "[INFO] Installing build dependencies..."
pip install pyinstaller

# Install project dependencies
echo "[INFO] Installing project dependencies..."
pip install -r requirements.txt

# Build with PyInstaller
echo "[INFO] Building executable..."
pyinstaller --name="AutoAIphoneAgent" \
    --onefile \
    --windowed \
    --add-data "config:config" \
    --hidden-import=uvicorn.lifespan.on \
    --hidden-import=uvicorn.lifespan.off \
    --hidden-import=uvicorn.protocols.websockets.auto \
    --hidden-import=uvicorn.protocols.http.auto \
    --hidden-import=uvicorn.loops.auto \
    --hidden-import=uvicorn.logging \
    --collect-all=openai.agents \
    --collect-all=fastapi \
    --collect-all=uvicorn \
    main.py

if [ $? -ne 0 ]; then
    echo "[ERROR] Build failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "Build completed successfully!"
echo "========================================"
echo ""
echo "Executable location: dist/AutoAIphoneAgent"
echo ""
echo "You can now:"
echo "1. Run dist/AutoAIphoneAgent to start the agent"
echo "2. Or use installer.py for GUI installation"
echo ""

