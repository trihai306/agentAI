#!/bin/bash
# AutoAIphone Agent - macOS Launcher
# Simple launcher script for macOS

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "[INFO] Virtual environment not found. Running installer..."
    python3 installer.py
    if [ $? -ne 0 ]; then
        echo "[ERROR] Installer failed!"
        exit 1
    fi
fi

# Activate virtual environment
source venv/bin/activate

# Check if dependencies are installed
python -c "import openai.agents" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[INFO] Dependencies not found. Installing..."
    pip install -r requirements.txt
fi

# Start agent
echo "[INFO] Starting AutoAIphone Agent..."
echo ""
python main.py

