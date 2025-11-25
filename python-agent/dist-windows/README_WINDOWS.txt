========================================
AutoAIphone Agent - Windows Installation
========================================

CÁCH 1: Chạy tự động (Khuyến nghị)
----------------------------------
1. Double-click vào file: launcher.bat
2. Script sẽ tự động:
   - Tạo virtual environment (nếu chưa có)
   - Cài đặt dependencies
   - Chạy ứng dụng

Yêu cầu:
- Python 3.8+ đã được cài đặt
- Python đã được thêm vào PATH

CÁCH 2: Chạy thủ công
---------------------
1. Mở Command Prompt hoặc PowerShell
2. Di chuyển vào thư mục này:
   cd path\to\dist-windows
3. Tạo virtual environment:
   python -m venv venv
4. Kích hoạt venv:
   venv\Scripts\activate
5. Cài đặt dependencies:
   pip install -r requirements.txt
6. Chạy ứng dụng:
   python gui.py

CÁCH 3: Sử dụng run.bat (nếu đã setup venv)
-------------------------------------------
1. Đảm bảo đã chạy launcher.bat ít nhất 1 lần
2. Double-click vào: run.bat

LƯU Ý:
------
- Lần đầu chạy sẽ mất vài phút để cài đặt dependencies
- Cần kết nối internet để tải dependencies
- Ứng dụng sẽ tự động cài đặt ADB nếu chưa có

HỖ TRỢ:
-------
Nếu gặp lỗi, vui lòng kiểm tra:
1. Python đã được cài đặt: python --version
2. Python đã được thêm vào PATH
3. Kết nối internet ổn định
