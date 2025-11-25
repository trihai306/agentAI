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

        # Set background color to prevent white screen
        self.root.configure(bg="#f3f4f6")

        # System info
        self.system = platform.system()
        self.is_windows = self.system == "Windows"
        self.is_mac = self.system == "Darwin"
        self.is_linux = self.system == "Linux"

        # Paths - handle both script and exe execution
        if getattr(sys, 'frozen', False):
            # Running as compiled exe
            self.base_dir = Path(sys.executable).parent
        else:
            # Running as script
            self.base_dir = Path(__file__).parent

        self.venv_dir = self.base_dir / "venv"
        self.requirements_file = self.base_dir / "requirements.txt"

        # Find actual Python executable (not exe file)
        self.python_exe = self._find_python_executable()

        # Ensure base_dir exists and is writable
        try:
            self.base_dir.mkdir(parents=True, exist_ok=True)
            # Test write permission
            test_file = self.base_dir / ".test_write"
            test_file.write_text("test")
            test_file.unlink()
        except Exception as e:
            # Can't use self.log() here, log method not yet available
            print(f"⚠️ Warning: Cannot write to {self.base_dir}: {e}")

        # Status
        self.status = {
            "python": False,
            "adb": False,
            "dependencies": False,
            "venv": False,
        }

        # Setup UI first (creates log method)
        try:
            self.setup_ui()
        except Exception as e:
            # If UI setup fails, show error in window
            error_label = tk.Label(
                self.root,
                text=f"❌ Lỗi khi khởi tạo UI:\n{str(e)}",
                font=("Arial", 12),
                fg="#ef4444",
                bg="#f3f4f6",
                justify=tk.LEFT,
                wraplength=700
            )
            error_label.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
            import traceback
            print(f"Error in setup_ui: {traceback.format_exc()}")
            return

        # Now we can use self.log()
        if not self.base_dir.exists():
            self.log(f"⚠️ Warning: Base directory does not exist: {self.base_dir}", "WARNING")

        # Check requirements
        try:
            self.check_requirements()
        except Exception as e:
            self.log(f"❌ Lỗi khi kiểm tra requirements: {e}", "ERROR")
            import traceback
            print(f"Error in check_requirements: {traceback.format_exc()}")

    def _find_python_executable(self):
        """Find actual Python executable, not exe file"""
        if getattr(sys, 'frozen', False):
            # Running as exe - need to find system Python
            import shutil
            # Try common Python executables
            python_names = ['python3', 'python3.11', 'python3.12', 'python']

            for name in python_names:
                python_path = shutil.which(name)
                if python_path:
                    # Verify it's actually Python
                    try:
                        result = subprocess.run(
                            [python_path, '--version'],
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                        if result.returncode == 0:
                            return python_path
                    except:
                        continue

            # If not found, try to use sys.executable's parent (if it's a Python installation)
            # But this is unlikely for PyInstaller exe
            return None
        else:
            # Running as script - use current Python
            return sys.executable

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

        # Progress bar frame
        progress_frame = tk.LabelFrame(main_frame, text="Installation Progress", font=("Arial", 10, "bold"))
        progress_frame.pack(fill=tk.X, pady=10)

        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            variable=self.progress_var,
            maximum=100,
            length=400,
            mode='determinate'
        )
        self.progress_bar.pack(fill=tk.X, padx=10, pady=10)

        self.progress_label = tk.Label(
            progress_frame,
            text="0%",
            font=("Arial", 10, "bold"),
            fg="#2563eb"
        )
        self.progress_label.pack(pady=(0, 5))

        # Log output
        log_frame = tk.LabelFrame(main_frame, text="Installation Log", font=("Arial", 10, "bold"))
        log_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=12,
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
        # First check if adb is in PATH
        try:
            result = subprocess.run(
                ["adb", "version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.split("\n")[0] if result.stdout else "Unknown"
                self.log(f"✅ ADB detected: {version}", "SUCCESS")
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        except Exception:
            pass

        # If not in PATH, check common installation locations
        try:
            from agent.adb.adb_installer import ADBInstaller
            install_dir = Path.home() / ".local" / "bin" / "adb"
            installer = ADBInstaller(install_dir=str(install_dir))
            adb_path = installer.get_adb_path()
            if adb_path and Path(adb_path).exists():
                self.log(f"✅ ADB found at {adb_path}", "SUCCESS")
                return True
        except ImportError:
            pass
        except Exception:
            pass

        # Check other common locations
        system = platform.system()
        if system == "Darwin":  # macOS
            common_paths = [
                Path.home() / "Library" / "Android" / "sdk" / "platform-tools" / "adb",
                Path("/usr/local/bin/adb"),
                Path("/opt/homebrew/bin/adb"),
            ]
        elif system == "Windows":
            common_paths = [
                Path.home() / "AppData" / "Local" / "Android" / "Sdk" / "platform-tools" / "adb.exe",
            ]
        else:  # Linux
            common_paths = [
                Path.home() / "Android" / "Sdk" / "platform-tools" / "adb",
                Path("/usr/bin/adb"),
                Path("/usr/local/bin/adb"),
            ]

        for path in common_paths:
            if path.exists():
                self.log(f"✅ ADB found at {path}", "SUCCESS")
                return True

        # Not found
        self.log("❌ ADB not found. Will attempt auto-install.", "WARNING")
        return False

    def check_venv(self):
        """Check if virtual environment exists"""
        # Check bundled venv first (in same directory as exe)
        if self.venv_dir.exists():
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"
            if python_exe.exists():
                self.log("✅ Virtual environment found (bundled)", "SUCCESS")
                return True

        # Check if venv exists in parent directory (for bundled builds)
        parent_venv = self.base_dir.parent / "venv"
        if parent_venv.exists():
            python_exe = parent_venv / ("Scripts" if self.is_windows else "bin") / "python"
            if python_exe.exists():
                self.log("✅ Virtual environment found (in parent directory)", "SUCCESS")
                self.venv_dir = parent_venv  # Update venv_dir to use this
                return True

        self.log("❌ Virtual environment not found", "WARNING")
        return False

    def check_dependencies(self):
        """Check if dependencies are installed"""
        try:
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"

            if not python_exe.exists():
                self.log("❌ Python executable not found in venv", "WARNING")
                return False

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
            total_steps = 0
            current_step = 0

            # Count total steps needed
            if not self.status["adb"]:
                total_steps += 1
            if not self.status["venv"]:
                total_steps += 1
            if not self.status["dependencies"]:
                total_steps += 1

            if total_steps == 0:
                self.update_progress(100, "All requirements already installed!")
                self.root.after(0, self.check_requirements)
                return

            # Install ADB if needed
            if not self.status["adb"]:
                current_step += 1
                progress = int((current_step / total_steps) * 100)
                self.update_progress(progress, f"Installing ADB... ({current_step}/{total_steps})")
                self.log("Installing ADB...", "INFO")
                self.install_adb()
                self.update_progress(progress, f"ADB installation completed ({current_step}/{total_steps})")

            # Create venv if needed (skip if bundled venv exists)
            if not self.status["venv"]:
                # Check if bundled venv exists
                bundled_venv = self.base_dir / "venv"
                if bundled_venv.exists():
                    python_exe = bundled_venv / ("Scripts" if self.is_windows else "bin") / "python"
                    if python_exe.exists():
                        self.log("✅ Using bundled virtual environment", "SUCCESS")
                        self.venv_dir = bundled_venv
                        self.status["venv"] = True
                        self.status["dependencies"] = True  # Bundled venv already has dependencies
                        self.update_progress(100, "Using bundled venv - ready!")
                        self.root.after(0, self.check_requirements)
                        return

                # No bundled venv, create new one
                current_step += 1
                progress = int((current_step / total_steps) * 100)
                self.update_progress(progress, f"Creating virtual environment... ({current_step}/{total_steps})")
                self.log("Creating virtual environment...", "INFO")
                self.create_venv()
                self.update_progress(progress, f"Virtual environment created ({current_step}/{total_steps})")

            # Install dependencies if needed (skip if bundled venv)
            if self.status["venv"] and not self.status["dependencies"]:
                current_step += 1
                progress = int((current_step / total_steps) * 100)
                self.update_progress(progress, f"Installing Python dependencies... ({current_step}/{total_steps})")
                self.log("Installing Python dependencies...", "INFO")
                self.install_dependencies()
                self.update_progress(progress, f"Dependencies installation completed ({current_step}/{total_steps})")

            # Complete
            self.update_progress(100, "Installation completed!")
            self.root.after(0, self.check_requirements)
            self.log("✅ Installation completed!", "SUCCESS")
            self.root.after(0, lambda: messagebox.showinfo("Success", "All requirements have been installed successfully!"))

        except Exception as e:
            self.log(f"❌ Installation failed: {e}", "ERROR")
            self.update_progress(0, "Installation failed!")
            self.root.after(0, lambda: messagebox.showerror("Error", f"Installation failed: {e}"))
        finally:
            self.root.after(0, lambda: self.install_btn.config(state="normal"))

    def update_progress(self, value, text=""):
        """Update progress bar"""
        self.root.after(0, lambda: self.progress_var.set(value))
        if text:
            self.root.after(0, lambda: self.progress_label.config(text=f"{int(value)}% - {text}"))
        else:
            self.root.after(0, lambda: self.progress_label.config(text=f"{int(value)}%"))

    def install_adb(self):
        """Install ADB"""
        try:
            # Try to import ADBInstaller
            try:
                from agent.adb.adb_installer import ADBInstaller
            except ImportError:
                # If not available, try alternative import path
                try:
                    import sys
                    import os
                    # Add current directory to path
                    current_dir = Path(__file__).parent
                    sys.path.insert(0, str(current_dir))
                    from agent.adb.adb_installer import ADBInstaller
                except ImportError:
                    self.log("⚠️ ADBInstaller not available. ADB will be auto-installed when agent starts", "WARNING")
                    self.status["adb"] = True  # Assume it will work
                    return

            # Install ADB to user's local bin directory
            install_dir = Path.home() / ".local" / "bin" / "adb"
            self.log(f"Installing ADB to {install_dir}...", "INFO")

            installer = ADBInstaller(install_dir=str(install_dir))
            adb_path = installer.install()

            if adb_path:
                self.log(f"✅ ADB installed successfully at {adb_path}", "SUCCESS")
                # Add to PATH for current session
                installer.add_to_path(adb_path)
                self.status["adb"] = True
            else:
                self.log("⚠️ ADB installation failed. Will attempt auto-install when agent starts", "WARNING")
                self.status["adb"] = True  # Assume it will work later

        except Exception as e:
            self.log(f"⚠️ ADB installation error: {e}. Will attempt auto-install when agent starts", "WARNING")
            import traceback
            print(f"ADB installation error: {traceback.format_exc()}")
            self.status["adb"] = True  # Assume it will work later

    def create_venv(self):
        """Create virtual environment"""
        try:
            # Log paths for debugging
            self.log(f"Base directory: {self.base_dir}", "INFO")
            self.log(f"Venv directory: {self.venv_dir}", "INFO")
            self.log(f"Python executable: {self.python_exe}", "INFO")

            # Check if Python executable is available
            if not self.python_exe:
                raise Exception("Python executable not found! Please install Python 3.8+ from https://www.python.org/")

            if not os.path.exists(self.python_exe):
                raise Exception(f"Python executable not found at: {self.python_exe}")

            # Check if base_dir is writable
            if not os.access(str(self.base_dir), os.W_OK):
                raise Exception(f"No write permission to {self.base_dir}")

            # Remove existing venv if exists
            if self.venv_dir.exists():
                self.log("Removing existing virtual environment...", "INFO")
                try:
                    shutil.rmtree(self.venv_dir)
                except Exception as e:
                    self.log(f"⚠️ Warning: Could not remove existing venv: {e}", "WARNING")
                    # Try to continue anyway

            # Ensure parent directory exists
            self.venv_dir.parent.mkdir(parents=True, exist_ok=True)

            self.log("Creating virtual environment (this may take 1-2 minutes)...", "INFO")
            self.update_progress(50, "Creating virtual environment...")

            # Try using subprocess.run first (simpler and more reliable)
            try:
                self.log(f"Attempting to create venv with: {self.python_exe} -m venv {self.venv_dir}", "INFO")
                result = subprocess.run(
                    [self.python_exe, "-m", "venv", str(self.venv_dir)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=300,  # 5 minutes timeout
                    check=False
                )

                if result.returncode == 0:
                    self.update_progress(100, "Virtual environment created!")
                    self.log("✅ Virtual environment created", "SUCCESS")
                    self.status["venv"] = True
                    return
                else:
                    error = result.stderr if result.stderr else result.stdout or "Unknown error"
                    error_msg = error[:500] if len(error) > 500 else error
                    self.log(f"venv creation failed with return code {result.returncode}", "ERROR")
                    self.log(f"Error output: {error_msg}", "ERROR")
                    raise Exception(f"venv creation failed: {error_msg}")

            except subprocess.TimeoutExpired:
                raise Exception("Virtual environment creation timed out after 5 minutes. This may indicate system issues.")
            except FileNotFoundError:
                raise Exception(f"Python executable not found: {sys.executable}")
            except PermissionError:
                raise Exception(f"No permission to create venv in {self.venv_dir}. Please check folder permissions.")
            except Exception as e:
                # If subprocess.run fails, try alternative method
                self.log(f"subprocess.run failed: {e}, trying alternative method...", "WARNING")
                raise

        except Exception as e:
            error_msg = str(e)
            self.log(f"❌ Failed to create venv: {error_msg}", "ERROR")

            # Provide helpful suggestions
            if "permission" in error_msg.lower() or "Permission" in error_msg:
                self.log("💡 Suggestion: Try running with administrator/sudo privileges", "INFO")
            elif "timeout" in error_msg.lower():
                self.log("💡 Suggestion: The system may be slow. Try again or check system resources.", "INFO")

            raise

    def install_dependencies(self):
        """Install Python dependencies"""
        try:
            python_exe = self.venv_dir / ("Scripts" if self.is_windows else "bin") / "python"

            # Upgrade pip
            self.log("Upgrading pip...", "INFO")
            self.update_progress(10, "Upgrading pip...")
            subprocess.run(
                [str(python_exe), "-m", "pip", "install", "--upgrade", "pip"],
                check=True,
                timeout=120
            )
            self.update_progress(30, "Pip upgraded, installing dependencies...")

            # Install requirements
            self.log("Installing dependencies (this may take a few minutes)...", "INFO")
            process = subprocess.Popen(
                [str(python_exe), "-m", "pip", "install", "-r", str(self.requirements_file)],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )

            # Read output line by line and update progress
            output_lines = []
            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    output_lines.append(line.strip())
                    # Update progress gradually (30% to 90%)
                    if len(output_lines) % 10 == 0:
                        progress = min(30 + int((len(output_lines) / 100) * 60), 90)
                        self.update_progress(progress, f"Installing packages... ({len(output_lines)} packages)")

            returncode = process.wait(timeout=600)

            if returncode == 0:
                self.update_progress(100, "Dependencies installed successfully!")
                self.log("✅ Dependencies installed successfully", "SUCCESS")
                self.status["dependencies"] = True
            else:
                error_output = '\n'.join(output_lines[-10:])  # Last 10 lines
                raise Exception(f"pip install failed: {error_output}")
        except subprocess.TimeoutExpired:
            if 'process' in locals():
                process.kill()
            raise Exception("Dependencies installation timed out")
        except Exception as e:
            self.log(f"❌ Failed to install dependencies: {e}", "ERROR")
            raise
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

            if not python_exe.exists():
                messagebox.showerror("Error", "Python executable not found in virtual environment!")
                return

            self.log("Starting agent...", "INFO")

            # Try to import and run main() directly from bundled code
            try:
                import sys

                # If running as exe, main.py is bundled, try to import it
                if getattr(sys, 'frozen', False):
                    # Running as exe - main.py is bundled
                    try:
                        import main
                        import asyncio
                        import threading

                        def run_agent():
                            try:
                                asyncio.run(main.main())
                            except KeyboardInterrupt:
                                self.log("Agent stopped by user", "INFO")
                            except Exception as e:
                                self.log(f"❌ Agent error: {e}", "ERROR")
                                import traceback
                                self.log(f"Traceback: {traceback.format_exc()}", "ERROR")

                        # Run in background thread
                        agent_thread = threading.Thread(target=run_agent, daemon=True)
                        agent_thread.start()
                        self.log("✅ Agent started from bundled code", "SUCCESS")
                        messagebox.showinfo("Success", "Agent is starting!\n\nCheck the log for status.\n\nHTTP: http://127.0.0.1:3001\nWebSocket: ws://127.0.0.1:3002")
                        return
                    except ImportError as import_err:
                        self.log(f"⚠️ Could not import main from bundle: {import_err}, trying file...", "WARNING")

                # Fallback: try to find main.py file
                main_file = self.base_dir / "main.py"
                if main_file.exists():
                    # Open in new window/terminal
                    if self.is_windows:
                        cmd = f'start "AutoAIphone Agent" cmd /k "{python_exe}" "{main_file}"'
                        subprocess.Popen(cmd, shell=True)
                    elif self.is_mac:
                        script = f'''
                        tell application "Terminal"
                            activate
                            do script "cd '{self.base_dir}' && '{python_exe}' '{main_file}'"
                        end tell
                        '''
                        subprocess.Popen(["osascript", "-e", script])
                    else:
                        subprocess.Popen(
                            ["xterm", "-e", f"{python_exe} {main_file}"],
                            cwd=str(self.base_dir)
                        )
                    self.log("✅ Agent started in new window", "SUCCESS")
                    messagebox.showinfo("Success", "Agent is starting in a new window!\n\nCheck the terminal window for status.")
                else:
                    messagebox.showerror("Error", "main.py not found and could not import from bundle!")

            except Exception as import_error:
                self.log(f"⚠️ Import error: {import_error}, trying file method...", "WARNING")
                # Fallback to file method
                main_file = self.base_dir / "main.py"
                if main_file.exists():
                    if self.is_windows:
                        cmd = f'start "AutoAIphone Agent" cmd /k "{python_exe}" "{main_file}"'
                        subprocess.Popen(cmd, shell=True)
                    elif self.is_mac:
                        script = f'''
                        tell application "Terminal"
                            activate
                            do script "cd '{self.base_dir}' && '{python_exe}' '{main_file}'"
                        end tell
                        '''
                        subprocess.Popen(["osascript", "-e", script])
                    self.log("✅ Agent started in new window", "SUCCESS")
                    messagebox.showinfo("Success", "Agent is starting in a new window!")
                else:
                    raise

        except Exception as e:
            self.log(f"❌ Failed to start agent: {e}", "ERROR")
            import traceback
            self.log(f"Traceback: {traceback.format_exc()}", "ERROR")
            messagebox.showerror("Error", f"Failed to start agent: {e}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = AgentInstaller(root)
    root.mainloop()


if __name__ == "__main__":
    main()

