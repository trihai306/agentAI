#!/usr/bin/env python3
"""
AutoAIphone Agent - Simple GUI Launcher
GUI đơn giản với 2 nút: Cài đặt và Kết nối
"""

import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import sys
import webbrowser
import threading
import os
from pathlib import Path

# Import installer class
# Import at top level so PyInstaller can detect it
try:
    import installer
    from installer import AgentInstaller
except ImportError as e:
    # If installer.py is not available, create a simple fallback
    import sys
    print(f"Warning: Could not import installer: {e}", file=sys.stderr)
    AgentInstaller = None
    installer = None


class SimpleGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("AutoAIphone Agent")
        self.root.geometry("400x250")
        self.root.resizable(False, False)

        # Center window
        self.center_window()

        # Setup UI
        self.setup_ui()

    def center_window(self):
        """Center window on screen"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')

    def setup_ui(self):
        """Setup UI components"""
        # Main frame
        main_frame = tk.Frame(self.root, padx=30, pady=30)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Title
        title_label = tk.Label(
            main_frame,
            text="AutoAIphone Agent",
            font=("Arial", 18, "bold"),
            fg="#2563eb"
        )
        title_label.pack(pady=(0, 20))

        # Subtitle
        subtitle_label = tk.Label(
            main_frame,
            text="Quản lý và điều khiển thiết bị Android",
            font=("Arial", 10),
            fg="#6b7280"
        )
        subtitle_label.pack(pady=(0, 30))

        # Buttons frame
        buttons_frame = tk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, pady=10)

        # Button Cài đặt
        install_btn = tk.Button(
            buttons_frame,
            text="🔧 Cài đặt",
            font=("Arial", 12, "bold"),
            bg="#10b981",
            fg="white",
            activebackground="#059669",
            activeforeground="white",
            relief=tk.FLAT,
            padx=30,
            pady=15,
            cursor="hand2",
            command=self.run_installer
        )
        install_btn.pack(fill=tk.X, pady=(0, 15))

        # Button Kết nối
        connect_btn = tk.Button(
            buttons_frame,
            text="🌐 Kết nối",
            font=("Arial", 12, "bold"),
            bg="#3b82f6",
            fg="white",
            activebackground="#2563eb",
            activeforeground="white",
            relief=tk.FLAT,
            padx=30,
            pady=15,
            cursor="hand2",
            command=self.open_connection
        )
        connect_btn.pack(fill=tk.X)

        # Status label
        self.status_label = tk.Label(
            main_frame,
            text="",
            font=("Arial", 9),
            fg="#6b7280"
        )
        self.status_label.pack(pady=(20, 0))

    def run_installer(self):
        """Chạy installer - đóng cửa sổ hiện tại và mở màn hình installer mới"""
        try:
            if AgentInstaller is None:
                messagebox.showerror(
                    "Lỗi",
                    "Installer không khả dụng. Vui lòng đảm bảo file installer.py có trong thư mục."
                )
                return

            # Đóng cửa sổ hiện tại và mở installer trong cùng root
            self.root.destroy()

            # Tạo root mới cho installer
            installer_root = tk.Tk()
            try:
                installer_app = AgentInstaller(installer_root)
                installer_root.mainloop()
            except Exception as e:
                # Nếu có lỗi, hiển thị error window
                error_root = tk.Tk()
                error_root.title("Lỗi - AutoAIphone Agent")
                error_root.geometry("500x300")

                error_frame = tk.Frame(error_root, padx=20, pady=20)
                error_frame.pack(fill=tk.BOTH, expand=True)

                tk.Label(
                    error_frame,
                    text="❌ Lỗi khi khởi tạo Installer",
                    font=("Arial", 16, "bold"),
                    fg="#ef4444"
                ).pack(pady=10)

                error_text = tk.Text(
                    error_frame,
                    wrap=tk.WORD,
                    height=10,
                    width=50,
                    font=("Courier", 9)
                )
                error_text.pack(fill=tk.BOTH, expand=True, pady=10)
                error_text.insert("1.0", f"Chi tiết lỗi:\n\n{str(e)}\n\n{type(e).__name__}")
                error_text.config(state=tk.DISABLED)

                tk.Button(
                    error_frame,
                    text="Đóng",
                    command=error_root.destroy,
                    bg="#ef4444",
                    fg="white",
                    padx=20,
                    pady=5
                ).pack(pady=10)

                error_root.mainloop()

        except Exception as e:
            import traceback
            error_msg = f"Không thể mở installer:\n\n{str(e)}\n\n{traceback.format_exc()}"
            messagebox.showerror("Lỗi", error_msg)

    def open_connection(self):
        """Mở trình duyệt đến trang kết nối"""
        try:
            url = "https://lionsoftware.cloud/chat"
            webbrowser.open(url)
            self.status_label.config(
                text=f"✅ Đã mở trình duyệt: {url}",
                fg="#10b981"
            )
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể mở trình duyệt: {e}")
            self.status_label.config(
                text="❌ Lỗi khi mở trình duyệt",
                fg="#ef4444"
            )


def main():
    """Main entry point"""
    root = tk.Tk()
    app = SimpleGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()

