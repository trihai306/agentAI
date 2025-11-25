#!/bin/bash
# AutoAIphone Agent - Build All Platforms
# Build cả macOS và Windows

set -e

echo "========================================"
echo "AutoAIphone Agent - Build All Platforms"
echo "========================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Build macOS
echo "[1/3] Building macOS version..."
./build_macos.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ macOS build completed: dist-macos/"
    MAC_SIZE=$(du -sh dist-macos/AutoAIphoneAgent-macOS.zip 2>/dev/null | awk '{print $1}' || echo "N/A")
    echo "   File size: $MAC_SIZE"
else
    echo "❌ macOS build failed!"
    exit 1
fi

echo ""
echo "[2/3] Building Windows package (Python - có source code)..."
./build_windows.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Windows package build completed: dist-windows/"
    WIN_SIZE=$(du -sh dist-windows/AutoAIphoneAgent-Windows.zip 2>/dev/null | awk '{print $1}' || echo "N/A")
    echo "   File size: $WIN_SIZE"
else
    echo "❌ Windows package build failed!"
    exit 1
fi

echo ""
echo "[3/3] Windows EXE build (không lộ source code)..."
echo ""
echo "⚠️  Để build Windows EXE, bạn có 2 lựa chọn:"
echo ""
echo "CÁCH 1: Tự động qua GitHub Actions (Khuyến nghị)"
echo "--------------------------------"
echo "   ./build_windows_exe.sh"
echo ""
echo "CÁCH 2: Build thủ công trên máy Windows"
echo "--------------------------------"
echo "   1. Copy thư mục python-agent sang máy Windows"
echo "   2. Chạy: build_windows.bat (nếu có)"
echo ""

echo "========================================"
echo "Build Summary"
echo "========================================"
echo "✅ macOS: dist-macos/AutoAIphoneAgent-macOS.zip"
echo "✅ Windows (Python): dist-windows/AutoAIphoneAgent-Windows.zip"
echo "⚠️  Windows (EXE): Dùng ./build_windows_exe.sh để build .exe"
echo ""
echo "📋 Note:"
echo "   - Windows Python package: Cần Python 3.8+ trên Windows"
echo "   - Windows EXE: Không cần Python, không lộ source code"
echo ""

