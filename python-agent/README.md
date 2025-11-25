# Python Agent - OpenAI Agents SDK

Python agent application sử dụng OpenAI Agents SDK để điều khiển thiết bị Android thông minh qua ADB, với khả năng tư duy và phân tích.

## Tính năng

- **Điều khiển Android qua ADB**: Tương tác với thiết bị Android qua ADB commands
- **Element-based Interaction**: Tất cả tương tác dựa trên UI elements, không dùng coordinates
- **OpenAI Agents SDK**: Sử dụng OpenAI Agents SDK với khả năng tư duy và reasoning
- **Real-time Updates**: WebSocket server cho real-time events
- **OpenAI Integration**: Tích hợp với OpenAI API
- **Cross-platform**: Chạy trên Mac và Windows

## Yêu cầu

- Python 3.9+ (khuyến nghị Python 3.11+)
- Android SDK Platform Tools (ADB) - **Tự động cài đặt nếu chưa có**
- OpenAI API key

## Phiên bản mới nhất

- **OpenAI Agents SDK**: 0.4.0+
- **OpenAI SDK**: 1.54.0+
- **FastAPI**: 0.115.0+
- **Uvicorn**: 0.32.0+

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd python-agent
pip install -r requirements.txt
```

### 2. Cấu hình

Chỉnh sửa `config/config.yaml`:

```yaml
server:
  http_port: 3001
  websocket_port: 3002
  host: "127.0.0.1"

adb:
  path: null  # null = auto-detect và auto-install nếu chưa có
  auto_install: true  # Tự động cài ADB nếu chưa tìm thấy
  install_dir: null  # null = dùng mặc định (~/.local/bin/adb)
  add_to_path: true  # Thêm ADB vào PATH sau khi cài

logging:
  level: "INFO"
  file: null  # null = console only
```

**Lưu ý**: Agent sẽ tự động tải và cài đặt ADB nếu chưa tìm thấy. ADB sẽ được cài vào `~/.local/bin/adb/platform-tools/` (Mac/Linux) hoặc `%USERPROFILE%\.local\bin\adb\platform-tools\` (Windows).

### 3. Chạy

#### Production Mode (không auto-reload)
```bash
python main.py
```

#### Development Mode (auto-reload khi code thay đổi) ⚡
```bash
# Mac/Linux
./dev.sh

# Windows
dev.bat

# Hoặc trực tiếp
python dev.py
```

**Lưu ý**: Dev mode sẽ tự động restart server khi bạn thay đổi bất kỳ file `.py`, `.yaml`, hoặc `.yml` trong thư mục `agent/`, `config/`, hoặc `main.py`.

Server sẽ chạy:
- HTTP API: `http://127.0.0.1:3001`
- WebSocket: `ws://127.0.0.1:3002`

## Sử dụng

### Kết nối thiết bị Android

1. Bật USB Debugging trên thiết bị
2. Kết nối qua USB hoặc WiFi ADB
3. Kiểm tra: `adb devices`

### API Endpoints

#### Health Check
```
GET /health
```

#### Devices
```
GET /api/devices
GET /api/devices/{device_id}/screen
POST /api/devices/{device_id}/click
POST /api/devices/{device_id}/swipe
POST /api/devices/{device_id}/type
POST /api/devices/{device_id}/key
```

#### AI Chat
```
POST /api/ai/chat
Body: {
  "message": "User message",
  "device_id": "device_id",
  "provider": "openai",
  "model": "gpt-4o",
  "api_key": "sk-...",
  "session_id": "session_id"
}

POST /api/ai/chat/stop
```

#### Models
```
GET /api/models/openai?main=true
```

### WebSocket Events

Client kết nối tới `ws://127.0.0.1:3002` và nhận các events:

- `connection:established` - Kết nối thành công
- `session:registered` - Session đã đăng ký
- `ai:tool:started` - Tool bắt đầu
- `ai:tool:completed` - Tool hoàn thành
- `ai:response:update` - Response streaming
- `ai:status:update` - Status updates
- `ai:thinking:structured` - Structured thinking
- `ai:tool:analysis` - Tool analysis
- `ai:chat:completed` - Chat hoàn thành
- `ai:plan:update` - Plan/task updates
- `mobile:screenshot` - Screenshot updates

## Mobile Tools

Tất cả tools tương tác qua ADB, không dùng MCP:

### Device Tools
- `mobile_list_available_devices` - Liệt kê thiết bị
- `mobile_get_screen_size` - Lấy kích thước màn hình
- `mobile_set_orientation` - Đổi hướng màn hình
- `mobile_get_orientation` - Lấy hướng hiện tại

### Screen Tools
- `mobile_take_screenshot` - Chụp màn hình
- `mobile_list_elements_on_screen` - Liệt kê UI elements

### Interaction Tools (Element-based)
- `mobile_click_element` - Click element (theo resource-id/text/description)
- `mobile_swipe_element` - Swipe từ element này sang element khác
- `mobile_double_tap_element` - Double tap element
- `mobile_long_press_element` - Long press element
- `mobile_type_keys` - Nhập text
- `mobile_press_button` - Nhấn phím (BACK, HOME, etc.)

### App Tools
- `mobile_launch_app` - Mở app theo package name
- `mobile_open_url` - Mở URL trong browser
- `mobile_list_apps` - Liệt kê apps đã cài

## Element-based Interaction

Agent sử dụng element-based interaction thay vì coordinates:

1. Chụp screenshot và dump UI hierarchy
2. Parse XML để tìm elements
3. Match element theo resource-id, text, hoặc description
4. Lấy bounds của element và tính center
5. Thực hiện action tại center coordinates

## Build

### macOS

```bash
./build_mac.sh
```

Output: `dist/mac/PythonAgent.app`

### Windows

```bash
build_win.bat
```

Output: `dist/win/PythonAgent.exe`

## Troubleshooting

### ADB not found
- **Agent sẽ tự động cài đặt ADB nếu chưa có** (mặc định bật `auto_install: true`)
- ADB sẽ được tải và cài vào `~/.local/bin/adb/platform-tools/` (Mac/Linux) hoặc `%USERPROFILE%\.local\bin\adb\platform-tools\` (Windows)
- Nếu auto-install thất bại, cài thủ công:
  - **Mac**: `brew install android-platform-tools` hoặc tải từ [Android Developer](https://developer.android.com/tools/releases/platform-tools)
  - **Linux**: Tải từ [Android Developer](https://developer.android.com/tools/releases/platform-tools)
  - **Windows**: Tải từ [Android Developer](https://developer.android.com/tools/releases/platform-tools)
- Hoặc chỉ định path trong `config/config.yaml` (`path: "/path/to/adb"`)

### Port already in use
- Thay đổi ports trong `config/config.yaml`
- Hoặc dừng process đang sử dụng ports

### Device not detected
- Kiểm tra `adb devices`
- Đảm bảo USB Debugging đã bật
- Thử disconnect và reconnect thiết bị

## Development

### Auto-reload Development Server

Để phát triển với auto-reload (server tự động restart khi code thay đổi):

```bash
# Mac/Linux
./dev.sh

# Windows  
dev.bat

# Hoặc
python dev.py
```

**Tính năng:**
- ✅ Tự động restart khi thay đổi file `.py`, `.yaml`, `.yml`
- ✅ Monitor thư mục `agent/`, `config/`, và `main.py`
- ✅ Hiển thị output của server real-time
- ✅ Graceful shutdown khi nhấn Ctrl+C

**Lưu ý**: Dev server sử dụng `watchfiles` để monitor file changes. Package này sẽ được tự động cài khi chạy `dev.sh` hoặc `dev.bat`.

### Project Structure

```
python-agent/
├── agent/
│   ├── adb/              # ADB client và UI Automator
│   ├── tools/            # Mobile tools
│   ├── server/           # HTTP và WebSocket servers
│   ├── utils/            # Utilities
│   └── agent.py          # Agent core
├── config/               # Configuration
├── main.py              # Entry point
└── requirements.txt     # Dependencies
```

## License

MIT

