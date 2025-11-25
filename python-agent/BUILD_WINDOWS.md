# Hướng dẫn Build Windows EXE

## Cách 1: Sử dụng GitHub Actions (Khuyến nghị - Tự động)

1. **Push code lên GitHub** (nếu chưa có):
   ```bash
   git add .
   git commit -m "Add Windows build workflow"
   git push origin main
   ```

2. **Chạy workflow**:
   - Vào GitHub repository
   - Chọn tab "Actions"
   - Chọn workflow "Build Windows Executable"
   - Click "Run workflow"
   - Chờ build hoàn tất (khoảng 5-10 phút)

3. **Tải file .exe**:
   - Sau khi build xong, vào "Artifacts"
   - Tải file `AutoAIphoneAgent-Windows.zip`
   - Giải nén để lấy `AutoAIphoneAgent.exe`

## Cách 2: Build trực tiếp trên Windows

Nếu bạn có máy Windows hoặc máy ảo Windows:

1. **Mở Command Prompt hoặc PowerShell**

2. **Chạy script build**:
   ```cmd
   cd python-agent
   build_windows.bat
   ```

3. **File .exe sẽ được tạo tại**:
   ```
   dist\AutoAIphoneAgent.exe
   ```

## Cách 3: Sử dụng Docker (Nâng cao)

Nếu bạn có Docker Desktop:

```bash
# Build Windows container (cần Windows container support)
docker run --rm -v "%cd%\python-agent:/app" -w /app python:3.11 bash -c "
  pip install pyinstaller -r requirements.txt &&
  pyinstaller --name=AutoAIphoneAgent --onefile --console --add-data 'config;config' main.py
"
```

## Lưu ý

- File .exe chỉ có thể build trên Windows hoặc sử dụng Windows runner (GitHub Actions)
- File build trên macOS sẽ là binary cho macOS, không phải .exe
- Kích thước file .exe thường khoảng 30-50MB

