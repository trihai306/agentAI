# Hướng dẫn cài đặt Python Agent

## Cài đặt tự động (Khuyến nghị)

### Mac/Linux
```bash
cd python-agent
./start.sh
```

Script sẽ tự động:
1. Tạo virtual environment nếu chưa có
2. Cài đặt tất cả dependencies
3. Khởi động agent

### Windows
```cmd
cd python-agent
start.bat
```

## Cài đặt thủ công

### 1. Tạo virtual environment
```bash
cd python-agent
python3 -m venv venv
```

### 2. Kích hoạt virtual environment

**Mac/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```cmd
venv\Scripts\activate
```

### 3. Cài đặt dependencies
```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 4. Chạy agent
```bash
python main.py
```

## Kiểm tra cài đặt

```bash
source venv/bin/activate
python -c "from agent.adb import ADBClient; print('✓ ADB Client OK')"
python -c "from agents import Agent; print('✓ OpenAI Agents SDK OK')"
python -c "import fastapi; print('✓ FastAPI OK')"
```

## Cấu hình

Chỉnh sửa `config/config.yaml` để cấu hình:
- Ports (HTTP: 3001, WebSocket: 3002)
- ADB path (hoặc để null để auto-detect và auto-install)
- Logging level

## Lưu ý

- Agent sẽ tự động cài đặt ADB nếu chưa có (mặc định bật)
- Đảm bảo có kết nối internet để tải ADB và dependencies
- Python 3.9+ được yêu cầu (khuyến nghị 3.11+)

