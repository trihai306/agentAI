# AutoAIphone Agent - Build Guide

Hướng dẫn build và chạy AutoAIphone Agent trên Windows và macOS.

## Yêu cầu hệ thống

### Windows
- Windows 10/11 (64-bit)
- Python 3.8 hoặc cao hơn
- 4GB RAM trở lên
- Kết nối internet để tải dependencies

### macOS
- macOS 10.15 (Catalina) hoặc cao hơn
- Python 3.8 hoặc cao hơn
- 4GB RAM trở lên
- Kết nối internet để tải dependencies

## Cài đặt nhanh (GUI)

### Windows
1. Mở `installer.py` bằng Python:
   ```cmd
   python installer.py
   ```
2. Hoặc double-click `installer.py` nếu đã cấu hình file association

### macOS
1. Mở Terminal
2. Chạy:
   ```bash
   python3 installer.py
   ```

Installer sẽ tự động:
- ✅ Kiểm tra Python version
- ✅ Kiểm tra ADB
- ✅ Tạo virtual environment
- ✅ Cài đặt dependencies
- ✅ Cung cấp nút Start Agent

## Cài đặt thủ công

### Windows

1. **Cài đặt Python** (nếu chưa có):
   - Tải từ https://www.python.org/downloads/
   - Chọn "Add Python to PATH" khi cài đặt

2. **Chạy installer**:
   ```cmd
   python installer.py
   ```

3. **Hoặc cài đặt thủ công**:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   ```

### macOS

1. **Cài đặt Python** (nếu chưa có):
   ```bash
   # Sử dụng Homebrew
   brew install python3
   ```

2. **Chạy installer**:
   ```bash
   python3 installer.py
   ```

3. **Hoặc cài đặt thủ công**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

## Build Executable

### Windows

1. **Chạy build script**:
   ```cmd
   build_windows.bat
   ```

2. **Executable sẽ được tạo tại**:
   ```
   dist\AutoAIphoneAgent.exe
   ```

3. **Chạy executable**:
   - Double-click `AutoAIphoneAgent.exe`
   - Hoặc chạy từ command line

### macOS

1. **Cấp quyền thực thi**:
   ```bash
   chmod +x build_mac.sh
   chmod +x launcher_mac.sh
   ```

2. **Chạy build script**:
   ```bash
   ./build_mac.sh
   ```

3. **Executable sẽ được tạo tại**:
   ```
   dist/AutoAIphoneAgent
   ```

4. **Chạy executable**:
   ```bash
   ./dist/AutoAIphoneAgent
   ```

## Launcher Scripts

### Windows
Sử dụng `launcher_windows.bat`:
```cmd
launcher_windows.bat
```

Script sẽ tự động:
- Kiểm tra virtual environment
- Cài đặt dependencies nếu thiếu
- Khởi động agent

### macOS
Sử dụng `launcher_mac.sh`:
```bash
chmod +x launcher_mac.sh
./launcher_mac.sh
```

## Cấu trúc thư mục

```
python-agent/
├── main.py                 # Entry point
├── installer.py            # GUI installer
├── build_windows.bat       # Windows build script
├── build_mac.sh           # macOS build script
├── launcher_windows.bat   # Windows launcher
├── launcher_mac.sh        # macOS launcher
├── requirements.txt       # Python dependencies
├── config/
│   └── config.yaml        # Configuration file
├── agent/                 # Agent code
└── venv/                  # Virtual environment (created)
```

## Troubleshooting

### Python không tìm thấy
- **Windows**: Đảm bảo đã chọn "Add Python to PATH" khi cài đặt
- **macOS**: Sử dụng `python3` thay vì `python`

### ADB không tìm thấy
- Agent sẽ tự động cài đặt ADB khi chạy lần đầu
- Hoặc cài đặt thủ công từ https://developer.android.com/studio/releases/platform-tools

### Dependencies cài đặt thất bại
- Kiểm tra kết nối internet
- Thử upgrade pip: `pip install --upgrade pip`
- Thử cài đặt từng package riêng lẻ

### Port đã được sử dụng
- HTTP server mặc định: port 3001
- WebSocket server mặc định: port 3002
- Thay đổi trong `config/config.yaml` nếu cần

## Kiểm tra cài đặt

Sau khi cài đặt, kiểm tra:

1. **Python version**:
   ```bash
   python --version  # Windows
   python3 --version # macOS
   ```

2. **Dependencies**:
   ```bash
   python -m pip list | grep openai-agents
   ```

3. **ADB**:
   ```bash
   adb version
   ```

4. **Agent**:
   ```bash
   python main.py
   ```

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log trong installer GUI
2. Kiểm tra `config/config.yaml`
3. Xem `README.md` và `QUICKSTART.md`

