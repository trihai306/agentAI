# AutoAI Phone - Chat với Android Streaming

Ứng dụng web chat giống ChatGPT với khả năng stream và điều khiển thiết bị Android qua ADB và Mobile-MCP.

## Kiến trúc

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   Web App       │────────▶│  Local App   │────────▶│  Mobile     │
│ (Laravel+React) │  API    │  (Node.js)   │  ADB    │  Device     │
│   (Server)      │◀────────│ (User PC)    │◀────────│ (USB/WiFi)  │
└─────────────────┘         └──────────────┘         └─────────────┘
                                    │
                                    │ spawn
                                    ▼
                            ┌──────────────┐
                            │ mobile-mcp   │
                            │   (MCP)      │
                            └──────────────┘
```

## Yêu cầu

### Web App (Laravel)
- PHP 8.1+
- Composer
- Node.js 18+
- MySQL
- NPM/Yarn

### Local App (Node.js)
- Node.js 18+
- Android SDK Platform Tools (ADB)
- mobile-mcp (tự động cài khi chạy)

## Cài đặt

### 1. Web App

```bash
# Cài đặt dependencies
composer install
npm install

# Cấu hình .env
cp .env.example .env
php artisan key:generate

# Cấu hình database trong .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=autoaiphone
DB_USERNAME=root
DB_PASSWORD=

# Chạy migrations
php artisan migrate

# Build frontend
npm run build

# Hoặc chạy dev server
npm run dev
```

### 2. Local App

```bash
cd local-app

# Cài đặt dependencies
npm install

# Chạy Local App
./start.sh

# Hoặc
npm start
```

Local App sẽ chạy:
- HTTP API: `http://127.0.0.1:3001`
- WebSocket: `ws://127.0.0.1:3002`

## Sử dụng

1. **Khởi động Local App** trên máy người dùng:
   ```bash
   cd local-app
   ./start.sh
   ```

2. **Kết nối thiết bị Android**:
   - Bật USB Debugging trên thiết bị
   - Kết nối qua USB hoặc WiFi ADB
   - Kiểm tra: `adb devices`

3. **Mở Web App**:
   - Truy cập `http://autoaiphone.test` (hoặc domain của bạn)
   - Web app sẽ tự động detect Local App
   - Chọn thiết bị từ danh sách
   - Bắt đầu stream màn hình

## Tính năng

### Chat
- Giao diện chat giống ChatGPT
- Tích hợp OpenAI API
- Lưu lịch sử chat vào database

### Mobile Control
- **Device Management**: Liệt kê và chọn thiết bị
- **Screen Streaming**: Stream màn hình real-time qua screenshot
- **Device Control**: Click, swipe, type, press key
- **MCP Automation**: Sử dụng mobile-mcp tools để tự động hóa

### MCP Tools
- `mobile_list_available_devices` - Liệt kê thiết bị
- `mobile_take_screenshot` - Chụp màn hình
- `mobile_click_on_screen_at_coordinates` - Click tại tọa độ
- `mobile_swipe_on_screen` - Swipe
- `mobile_type_keys` - Nhập text
- `mobile_list_elements_on_screen` - Liệt kê UI elements
- `mobile_press_button` - Nhấn phím

## API Endpoints

### Web App API (Laravel)
- `GET /api/mobile/check` - Kiểm tra kết nối Local App
- `GET /api/mobile/devices` - Lấy danh sách thiết bị
- `GET /api/mobile/devices/{id}/screen` - Lấy screenshot
- `POST /api/mobile/devices/{id}/click` - Click
- `POST /api/mobile/devices/{id}/swipe` - Swipe
- `POST /api/mobile/devices/{id}/type` - Nhập text
- `POST /api/mobile/devices/{id}/key` - Nhấn phím
- `GET /api/mobile/mcp/tools` - Lấy danh sách MCP tools
- `POST /api/mobile/mcp/execute` - Thực thi MCP tool

### Local App API (Node.js)
- `GET /health` - Health check
- `GET /api/devices` - Danh sách thiết bị
- `GET /api/devices/:id/screen` - Screenshot (PNG)
- `POST /api/devices/:id/click` - Click
- `POST /api/devices/:id/swipe` - Swipe
- `POST /api/devices/:id/type` - Type
- `POST /api/devices/:id/key` - Key press
- `GET /api/mcp/tools` - MCP tools
- `POST /api/mcp/execute` - Execute MCP tool

## Cấu hình

### Environment Variables

#### Web App (.env)
```env
OPENAI_API_KEY=your_openai_api_key
LOCAL_APP_URL=http://127.0.0.1:3001
LOCAL_APP_WS_URL=ws://127.0.0.1:3002
```

#### Local App
```bash
export ADB_PATH=/path/to/adb
export ANDROID_HOME=/path/to/android/sdk
```

## Troubleshooting

### Local App không kết nối được
- Kiểm tra Local App đang chạy: `curl http://127.0.0.1:3001/health`
- Kiểm tra firewall không chặn port 3001, 3002
- Đảm bảo Local App chỉ listen trên localhost

### Không thấy thiết bị
- Kiểm tra ADB: `adb devices`
- Đảm bảo USB Debugging đã bật
- Thử disconnect và reconnect thiết bị

### MCP tools không hoạt động
- Kiểm tra mobile-mcp đã được cài: `npx -y @mobilenext/mobile-mcp@latest`
- Xem logs trong Local App console
- Đảm bảo thiết bị đã được chọn

## Development

### Web App
```bash
# Dev mode với hot reload
npm run dev

# Build production
npm run build
```

### Local App
```bash
# Dev mode với auto-reload
npm run dev
```

## License

MIT
