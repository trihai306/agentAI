# AutoAIphone Agent - Build & Installation Guide

Hướng dẫn đầy đủ để build và cài đặt AutoAIphone Agent trên Windows và macOS.

## 📦 Các file đã tạo

### Installer & Launcher
- **`installer.py`** - GUI installer với tkinter (Windows & macOS)
- **`launcher_windows.bat`** - Launcher script cho Windows
- **`launcher_mac.sh`** - Launcher script cho macOS

### Build Scripts
- **`build_windows.bat`** - Build executable cho Windows
- **`build_mac.sh`** - Build executable cho macOS
- **`pyinstaller.spec`** - PyInstaller configuration

### Documentation
- **`BUILD.md`** - Hướng dẫn build chi tiết
- **`QUICKSTART_GUI.md`** - Hướng dẫn nhanh với GUI
- **`README_BUILD.md`** - File này

## 🚀 Cách sử dụng nhanh

### Option 1: GUI Installer (Khuyến nghị)

#### Windows
```cmd
python installer.py
```

#### macOS
```bash
python3 installer.py
```

Installer sẽ:
1. ✅ Kiểm tra Python version
2. ✅ Kiểm tra ADB
3. ✅ Tạo virtual environment
4. ✅ Cài đặt dependencies
5. ✅ Cung cấp nút Start Agent

### Option 2: Launcher Scripts

#### Windows
Double-click `launcher_windows.bat` hoặc:
```cmd
launcher_windows.bat
```

#### macOS
```bash
chmod +x launcher_mac.sh
./launcher_mac.sh
```

### Option 3: Build Executable

#### Windows
```cmd
build_windows.bat
```
Executable: `dist\AutoAIphoneAgent.exe`

#### macOS
```bash
chmod +x build_mac.sh
./build_mac.sh
```
Executable: `dist/AutoAIphoneAgent`

## 📋 Yêu cầu hệ thống

### Windows
- Windows 10/11 (64-bit)
- Python 3.8+ (tải từ python.org)
- 4GB RAM
- Internet connection

### macOS
- macOS 10.15+ (Catalina)
- Python 3.8+ (có sẵn hoặc `brew install python3`)
- 4GB RAM
- Internet connection

## 🔧 Cài đặt thủ công

### 1. Cài đặt Python

**Windows:**
- Tải từ https://www.python.org/downloads/
- ✅ Chọn "Add Python to PATH" khi cài đặt

**macOS:**
```bash
brew install python3
```

### 2. Tạo Virtual Environment

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Cài đặt Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Chạy Agent

```bash
python main.py
```

## 🛠️ Build Executable

### Windows với PyInstaller

1. Cài đặt PyInstaller:
```cmd
pip install pyinstaller
```

2. Build:
```cmd
build_windows.bat
```

Hoặc thủ công:
```cmd
pyinstaller --name="AutoAIphoneAgent" --onefile --windowed main.py
```

### macOS với PyInstaller

1. Cài đặt PyInstaller:
```bash
pip install pyinstaller
```

2. Build:
```bash
./build_mac.sh
```

Hoặc thủ công:
```bash
pyinstaller --name="AutoAIphoneAgent" --onefile main.py
```

## 📁 Cấu trúc sau khi build

```
python-agent/
├── dist/
│   ├── AutoAIphoneAgent.exe  (Windows)
│   └── AutoAIphoneAgent      (macOS)
├── build/                    (temporary build files)
├── venv/                     (virtual environment)
├── config/
│   └── config.yaml
└── agent/                    (source code)
```

## ⚙️ Cấu hình

Chỉnh sửa `config/config.yaml`:

```yaml
server:
  http_port: 3001
  websocket_port: 3002
  host: "127.0.0.1"

adb:
  path: null  # null = auto-detect
  auto_install: true
  install_dir: null
  add_to_path: true

agent:
  max_turns: null  # null = unlimited (9999)
```

## 🐛 Troubleshooting

### Python không tìm thấy
- **Windows**: Đảm bảo đã chọn "Add Python to PATH"
- **macOS**: Sử dụng `python3` thay vì `python`

### ADB không tìm thấy
- Agent sẽ tự động cài đặt ADB khi chạy lần đầu
- Hoặc cài thủ công từ https://developer.android.com/studio/releases/platform-tools

### Dependencies cài đặt thất bại
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

### Port đã được sử dụng
- Thay đổi port trong `config/config.yaml`
- Hoặc kill process đang dùng port:
  - Windows: `netstat -ano | findstr :3001`
  - macOS: `lsof -i :3001`

### Executable không chạy được
- Kiểm tra log trong Terminal
- Thử chạy từ source: `python main.py`
- Kiểm tra permissions (macOS): `chmod +x dist/AutoAIphoneAgent`

## 📝 Notes

- **Virtual Environment**: Luôn sử dụng venv để tránh conflict dependencies
- **ADB Auto-install**: Agent sẽ tự động cài ADB nếu chưa có (cần internet)
- **Ports**: Đảm bảo port 3001 và 3002 không bị block bởi firewall
- **Internet**: Cần internet để:
  - Cài đặt dependencies
  - Auto-install ADB
  - Kết nối với OpenAI API

## 🎯 Next Steps

Sau khi agent đã chạy:
1. Mở frontend trong browser
2. Kết nối device Android qua USB
3. Enable USB debugging trên device
4. Bắt đầu chat với AI agent!

## 📚 Tài liệu thêm

- `README.md` - Tài liệu chính
- `QUICKSTART.md` - Hướng dẫn nhanh
- `QUICKSTART_GUI.md` - Hướng dẫn GUI installer
- `BUILD.md` - Hướng dẫn build chi tiết

