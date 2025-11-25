#!/bin/bash
# Tạo package build Windows để gửi cho khách

echo "========================================"
echo "Tạo Package Build Windows"
echo "========================================"
echo ""

PACKAGE_DIR="build-package-windows"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

echo "📦 Copying files..."

# Copy essential files
cp build_windows.bat "$PACKAGE_DIR/"
cp build_windows_simple.bat "$PACKAGE_DIR/"
cp pyinstaller_gui.spec "$PACKAGE_DIR/"
cp gui.py "$PACKAGE_DIR/"
cp installer.py "$PACKAGE_DIR/"
cp main.py "$PACKAGE_DIR/"
cp requirements.txt "$PACKAGE_DIR/"

# Copy directories
cp -r agent "$PACKAGE_DIR/"
cp -r config "$PACKAGE_DIR/"

# Copy instructions
cp BUILD_INSTRUCTIONS.txt "$PACKAGE_DIR/" 2>/dev/null || true
cp README_BUILD_FOR_CUSTOMER.txt "$PACKAGE_DIR/" 2>/dev/null || true

echo "✅ Files copied"
echo ""

# Create zip
ZIP_NAME="AutoAIphoneAgent-BuildPackage-Windows.zip"
cd "$PACKAGE_DIR"
zip -r "../$ZIP_NAME" . > /dev/null
cd ..

echo "✅ Package created: $ZIP_NAME"
echo ""
echo "📦 Package contents:"
ls -lh "$ZIP_NAME"
echo ""
echo "✅ Sẵn sàng gửi cho khách!"
