# Quick Start Guide

## Cài đặt đã hoàn tất ✓

Tất cả dependencies đã được cài đặt thành công trong virtual environment.

## Chạy Agent

### Cách 1: Sử dụng script (Khuyến nghị)

**Mac/Linux:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

### Cách 2: Chạy thủ công

```bash
# Kích hoạt virtual environment
source venv/bin/activate  # Mac/Linux
# hoặc
venv\Scripts\activate     # Windows

# Chạy agent
python main.py
```

## Kiểm tra cài đặt

```bash
source venv/bin/activate
python test_install.py
```

## Cấu hình

Chỉnh sửa `config/config.yaml`:

```yaml
server:
  http_port: 3001
  websocket_port: 3002
  host: "127.0.0.1"

adb:
  path: null              # null = auto-detect và auto-install
  auto_install: true     # Tự động cài ADB nếu chưa có
  install_dir: null       # Thư mục cài ADB (mặc định: ~/.local/bin/adb)
  add_to_path: true      # Thêm vào PATH

agent:
  default_provider: "openai"
  default_model: "gpt-4o"
```

## Sử dụng

1. **Khởi động agent:**
   ```bash
   ./start.sh
   ```

2. **Kết nối thiết bị Android:**
   - Bật USB Debugging
   - Kết nối qua USB hoặc WiFi ADB
   - Agent sẽ tự động detect thiết bị

3. **Truy cập từ frontend:**
   - HTTP API: `http://127.0.0.1:3001`
   - WebSocket: `ws://127.0.0.1:3002`

## Tính năng

- ✅ Tự động cài đặt ADB nếu chưa có
- ✅ Element-based interaction (không dùng coordinates)
- ✅ Real-time WebSocket events
- ✅ OpenAI Agents SDK với thinking & analysis
- ✅ Hỗ trợ Mac và Windows

## Troubleshooting

Nếu gặp lỗi, chạy test:
```bash
source venv/bin/activate
python test_install.py
```

