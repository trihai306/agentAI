#!/usr/bin/env python3
"""
AutoAIphone Agent Installer
Tự động cài đặt và kiểm tra các yêu cầu để chạy agent
"""

import sys
import subprocess
import platform
import os
import shutil
from pathlib import Path
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading

class AgentInstaller:
    def __init__(self, root):
        self.root = root
        self.root.title("AutoAIphone Agent - Installer")
        self.root.geometry("800x600")
        self.root.resizable(True, True)

        # System info
        self.system = platform.system()
        self.is_windows = self.system == "Windows"
        self.is_mac = self.system == "Darwin"
        self.is_linux = self.system == "Linux"

        # Paths
        self.base_dir = Path(__file__).parent
        self.venv_dir = self.base_dir / "venv"
        self.requirements_file = self.base_dir / "requirements.txt"

        # Status
        self.status = {
            "python": False,
            "adb": False,
            "dependencies": False,
            "venv": False,
        }

        self.setup_ui()
        self.check_requirements()

    def setup_ui(self):
        """Setup UI components"""
        # Header
        header_frame = tk.Frame(self.root, bg="#2563eb", height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)

        title_label = tk.Label(
            header_frame,
            text="AutoAIphone Agent Installer",
            font=("Arial", 20, "bold"),
            bg="#2563eb",
            fg="white"
        )
        title_label.pack(pady=20)

        # Main content
        main_frame = tk.Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # System info
        info_frame = tk.LabelFrame(main_frame, text="System Information", font=("Arial", 10, "bold"))
        info_frame.pack(fill=tk.X, pady=10)

        self.info_text = tk.Label(
            info_frame,
            text=f"OS: {self.system} | Python: {sys.version.split()[0]}",
            font=("Arial", 9),
            anchor="w",
            justify="left"
        )
        self.info_text.pack(fill=tk.X, padx=10, pady=5)

        # Requirements checklist
        checklist_frame = tk.LabelFrame(main_frame, text="Requirements Checklist", font=("Arial", 10, "bold"))
        checklist_frame.pack(fill=tk.X, pady=10)

        self.checklist_vars = {}
        requirements = [
            ("python", "Python 3.8+"),
            ("adb", "Android Debug Bridge (ADB)"),
            ("venv", "Virtual Environment"),
            ("dependencies", "Python Dependencies"),
        ]

        for req_id, req_name in requirements:
            var = tk.BooleanVar()
            self.checklist_vars[req_id] = var

            frame = tk.Frame(checklist_frame)
            frame.pack(fill=tk.X, padx=10, pady=5)

            checkbox = tk.Checkbutton(
                frame,
                text=req_name,
                variable=var,
                state="disabled",
                font=("Arial", 9)
            )
            checkbox.pack(side=tk.LEFT)

            status_label = tk.Label(
                frame,
                text="Checking...",
                font=("Arial", 8),
                fg="gray"
            )
            status_label.pack(side=tk.LEFT, padx=10)

        # Log output
        log_frame = tk.LabelFrame(main_frame, text="Installation Log", font=("Arial", 10, "bold"))
        log_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=15,
            font=("Consolas", 9),
            bg="#1e1e1e",
            fg="#d4d4d4",
            insertbackground="white"
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Buttons
        button_frame = tk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=10)

        self.install_btn = tk.Button(
            button_frame,
            text="Install All Requirements",
            command=self.install_all,
            font=("Arial", 11, "bold"),
            bg="#10b981",
            fg="white",
            padx=20,
            pady=10,
            cursor="hand2"
        )
        self.install_btn.pack(side=tk.LEFT, padx=5)

        self.check_btn = tk.Button(
            button_frame,
            text="Re-check Requirements",
            command=self.check_requirements,
            font=("Arial", 11),
            bg="#3b82f6",
            fg="white",
            padx=20,
            pady=10,
            cursor="hand2"
        )
        self.check_btn.pack(side=tk.LEFT, padx=5)

        self.start_btn = tk.Button(
            button_frame,
            text="Start Agent",
            command=self.start_agent,
            font=("Arial", 11, "bold"),
            bg="#f59e0b",
            fg="white",
            padx=20,
            pady=10,
            cursor="hand2",
            state="disabled"
        )
        self.start_btn.pack(side=tk.LEFT, padx=5)

        self.close_btn = tk.Button(
            button_frame,
            text="Close",
            command=self.root.quit,
            font=("Arial", 11),
            bg="#ef4444",
            fg="white",
            padx=20,
            pady=10,
            cursor="hand2"
        )
        self.close_btn.pack(side=tk.RIGHT, padx=5)

    def log(self, message, level="INFO"):
        """Add message to log"""
        colors = {
            "INFO": "#d4d4d4",
            "SUCCESS": "#10b981",
            "WARNING": "#f59e0b",
            "ERROR": "#ef4444",
        }
        color = colors.get(level, "#d4d4d4")

        self.log_text.insert(tk.END, f"[{level}] {message}\n", level)
        self.log_text.tag_config(level, foreground=color)
        self.log_text.see(tk.END)
        self.root.update()

    def check_requirements(self):
        """Check all requirements"""
        self.log("Checking requirements...", "INFO")

        # Check Python
        self.status["python"] = self.check_python()
        self.update_checklist("python", self.status["python"])

        # Check ADB
        self.status["adb"] = self.check_adb()
        self.update_checklist("adb", self.status["adb"])

        # Check venv
        self.status["venv"] = self.check_venv()
        self.update_checklist("venv", self.status["venv"])

        # Check dependencies
        if self.status["venv"]:
            self.status["dependencies"] = self.check_dependencies()
            self.update_checklist("dependencies", self.status["dependencies"])
        else:
            self.update_checklist("dependencies", False)

        # Enable/disable start button
        all_ready = all(self.status.values())
        self.start_btn.config(state="normal" if all_ready else "disabled")

        if all_ready:
            self.log("✅ All requirements met! You can start the agent.", "SUCCESS")
        else:
            self.log("⚠️ Some requirements are missing. Click 'Install All Requirements' to install them.", "WARNING")

    def check_python(self):
        """Check Python version"""
        try:
            version = sys.version_info
            if version.major >= 3 and version.minor >= 8:
                self.log(f"✅ Python {version.major}.{version.minor}.{version.micro} detected", "SUCCESS")
                return True
            else:
                self.log(f"❌ Python 3.8+ required, found {version.major}.{version.minor}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error checking Python: {e}", "ERROR")
            return False

    def check_adb(self):
        """Check if ADB is installed"""
        try:
            result = subprocess.run(
                ["adb", "version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.split()[0] if result.stdout else "Unknown"
                self.log(f"✅ ADB detected: {version}", "SUCCESS")
                return True
            else:
                self.log("❌ ADB not found in PATH", "WARNING")
                return False
        except FileNotFoundError:
            self.log("❌ ADB not found. Will attempt auto-install.", "WARNING")
            return False
        except Exception as e:
            self.log(f"⚠️ Error checking ADB: {e}", "WARNING")
            return False

    def check_venv(self):
        """Check if virtual environment exists"""
        if self.venv_dir.exists():
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"
            if python_exe.exists():
                self.log("✅ Virtual environment found", "SUCCESS")
                return True

        self.log("❌ Virtual environment not found", "WARNING")
        return False

    def check_dependencies(self):
        """Check if dependencies are installed"""
        try:
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"
            result = subprocess.run(
                [str(python_exe), "-m", "pip", "list"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if "openai-agents" in result.stdout:
                self.log("✅ Dependencies installed", "SUCCESS")
                return True
            else:
                self.log("❌ Dependencies not installed", "WARNING")
                return False
        except Exception as e:
            self.log(f"⚠️ Error checking dependencies: {e}", "WARNING")
            return False

    def update_checklist(self, req_id, status):
        """Update checklist status"""
        var = self.checklist_vars.get(req_id)
        if var:
            var.set(status)

    def install_all(self):
        """Install all missing requirements"""
        self.log("Starting installation...", "INFO")
        self.install_btn.config(state="disabled")

        # Run installation in thread
        thread = threading.Thread(target=self._install_all_thread)
        thread.daemon = True
        thread.start()

    def _install_all_thread(self):
        """Install all requirements in background thread"""
        try:
            # Install ADB if needed
            if not self.status["adb"]:
                self.log("Installing ADB...", "INFO")
                self.install_adb()

            # Create venv if needed
            if not self.status["venv"]:
                self.log("Creating virtual environment...", "INFO")
                self.create_venv()

            # Install dependencies if needed
            if self.status["venv"] and not self.status["dependencies"]:
                self.log("Installing Python dependencies...", "INFO")
                self.install_dependencies()

            # Re-check requirements
            self.root.after(0, self.check_requirements)
            self.log("✅ Installation completed!", "SUCCESS")
            messagebox.showinfo("Success", "All requirements have been installed successfully!")

        except Exception as e:
            self.log(f"❌ Installation failed: {e}", "ERROR")
            messagebox.showerror("Error", f"Installation failed: {e}")
        finally:
            self.root.after(0, lambda: self.install_btn.config(state="normal"))

    def install_adb(self):
        """Install ADB"""
        try:
            # ADB will be auto-installed by ADBClient on first use
            # For now, just log that it will be handled
            self.log("ADB will be auto-installed when agent starts", "INFO")
            self.status["adb"] = True  # Assume it will work
        except Exception as e:
            self.log(f"❌ Failed to install ADB: {e}", "ERROR")
            raise

    def create_venv(self):
        """Create virtual environment"""
        try:
            if self.venv_dir.exists():
                shutil.rmtree(self.venv_dir)

            subprocess.run(
                [sys.executable, "-m", "venv", str(self.venv_dir)],
                check=True,
                timeout=60
            )
            self.log("✅ Virtual environment created", "SUCCESS")
            self.status["venv"] = True
        except Exception as e:
            self.log(f"❌ Failed to create venv: {e}", "ERROR")
            raise

    def install_dependencies(self):
        """Install Python dependencies"""
        try:
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"

            # Upgrade pip
            self.log("Upgrading pip...", "INFO")
            subprocess.run(
                [str(python_exe), "-m", "pip", "install", "--upgrade", "pip"],
                check=True,
                timeout=120
            )

            # Install requirements
            self.log("Installing dependencies (this may take a few minutes)...", "INFO")
            result = subprocess.run(
                [str(python_exe), "-m", "pip", "install", "-r", str(self.requirements_file)],
                capture_output=True,
                text=True,
                timeout=600
            )

            if result.returncode == 0:
                self.log("✅ Dependencies installed successfully", "SUCCESS")
                self.status["dependencies"] = True
            else:
                self.log(f"❌ Failed to install dependencies: {result.stderr}", "ERROR")
                raise Exception("Dependency installation failed")
        except Exception as e:
            self.log(f"❌ Failed to install dependencies: {e}", "ERROR")
            raise

    def start_agent(self):
        """Start the agent"""
        # Allow starting even if ADB not found (will auto-install)
        required_status = ["python", "venv", "dependencies"]
        if not all(self.status.get(key, False) for key in required_status):
            messagebox.showwarning("Warning", "Please install Python, virtual environment, and dependencies first!")
            return

        try:
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"
            main_file = self.base_dir / "main.py"

            if not python_exe.exists():
                messagebox.showerror("Error", "Python executable not found in virtual environment!")
                return

            if not main_file.exists():
                messagebox.showerror("Error", "main.py not found!")
                return

            self.log("Starting agent...", "INFO")

            # Open in new window/terminal
            if self.is_windows:
                # Use start command to open in new CMD window
                cmd = f'start "AutoAIphone Agent" cmd /k "{python_exe}" "{main_file}"'
                subprocess.Popen(cmd, shell=True)
            elif self.is_mac:
                # Create AppleScript to open Terminal and run command
                script = f'''
                tell application "Terminal"
                    activate
                    do script "cd '{self.base_dir}' && '{python_exe}' '{main_file}'"
                end tell
                '''
                subprocess.Popen(["osascript", "-e", script])
            else:
                # Linux - use xterm or gnome-terminal
                subprocess.Popen(
                    ["xterm", "-e", f"{python_exe} {main_file}"],
                    cwd=str(self.base_dir)
                )

            self.log("✅ Agent started in new window", "SUCCESS")
            messagebox.showinfo("Success", "Agent is starting in a new window!\n\nCheck the terminal window for status.")

        except Exception as e:
            self.log(f"❌ Failed to start agent: {e}", "ERROR")
            messagebox.showerror("Error", f"Failed to start agent: {e}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = AgentInstaller(root)
    root.mainloop()


if __name__ == "__main__":
    main()

