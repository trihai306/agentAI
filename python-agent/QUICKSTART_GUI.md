# AutoAIphone Agent - Quick Start (GUI)

Hướng dẫn nhanh để chạy agent với GUI installer.

## Bước 1: Chạy Installer

### Windows
Double-click file `installer.py` hoặc chạy:
```cmd
python installer.py
```

### macOS
Mở Terminal và chạy:
```bash
python3 installer.py
```

## Bước 2: Cài đặt Requirements

1. Installer sẽ tự động kiểm tra:
   - ✅ Python 3.8+
   - ✅ Android Debug Bridge (ADB)
   - ✅ Virtual Environment
   - ✅ Python Dependencies

2. Nếu thiếu, click nút **"Install All Requirements"**

3. Đợi quá trình cài đặt hoàn tất (có thể mất vài phút)

## Bước 3: Khởi động Agent

1. Khi tất cả requirements đã được cài đặt, nút **"Start Agent"** sẽ sáng lên

2. Click **"Start Agent"** để khởi động

3. Agent sẽ chạy trong cửa sổ Terminal mới

## Sử dụng Launcher Scripts (Tùy chọn)

### Windows
Double-click `launcher_windows.bat` - script sẽ tự động:
- Kiểm tra và tạo venv nếu cần
- Cài đặt dependencies nếu thiếu
- Khởi động agent

### macOS
Chạy trong Terminal:
```bash
chmod +x launcher_mac.sh
./launcher_mac.sh
```

## Kiểm tra Agent đang chạy

Sau khi khởi động, bạn sẽ thấy:
```
Starting Python Agent...
HTTP server: http://127.0.0.1:3001
WebSocket server: ws://127.0.0.1:3002
```

## Kết nối với Frontend

1. Đảm bảo Laravel frontend đang chạy
2. Frontend sẽ tự động kết nối với agent tại:
   - HTTP: `http://127.0.0.1:3001`
   - WebSocket: `ws://127.0.0.1:3002`

## Troubleshooting

### Installer không mở được
- Đảm bảo Python đã được cài đặt
- Thử chạy: `python --version` (Windows) hoặc `python3 --version` (macOS)

### Cài đặt dependencies thất bại
- Kiểm tra kết nối internet
- Xem log trong installer để biết lỗi cụ thể
- Thử cài đặt thủ công: `pip install -r requirements.txt`

### Agent không khởi động
- Kiểm tra port 3001 và 3002 có đang được sử dụng không
- Xem log trong Terminal để biết lỗi cụ thể
- Kiểm tra file `config/config.yaml`

## Next Steps

Sau khi agent đã chạy:
1. Mở frontend trong browser
2. Chọn device từ danh sách
3. Bắt đầu chat với AI agent!

Xem `README.md` để biết thêm chi tiết về cấu hình và sử dụng.

