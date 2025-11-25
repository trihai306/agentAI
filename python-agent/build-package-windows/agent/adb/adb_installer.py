"""ADB auto-installer for Mac and Windows"""
import os
import platform
import subprocess
import shutil
import logging
import zipfile
import tarfile
from pathlib import Path
from typing import Optional
import urllib.request
import stat

logger = logging.getLogger(__name__)


class ADBInstaller:
    """Auto-installer for Android SDK Platform Tools (ADB)"""
    
    # Download URLs for platform tools
    DOWNLOAD_URLS = {
        "Darwin": {
            "arm64": "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip",
            "x86_64": "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip",
        },
        "Windows": {
            "x86_64": "https://dl.google.com/android/repository/platform-tools-latest-windows.zip",
        },
        "Linux": {
            "x86_64": "https://dl.google.com/android/repository/platform-tools-latest-linux.zip",
        },
    }
    
    def __init__(self, install_dir: Optional[str] = None):
        """
        Initialize ADB installer
        
        Args:
            install_dir: Directory to install ADB. If None, uses default location.
        """
        self.system = platform.system()
        self.machine = platform.machine()
        self.install_dir = install_dir or self._get_default_install_dir()
        Path(self.install_dir).mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def _get_default_install_dir() -> str:
        """Get default installation directory based on OS"""
        system = platform.system()
        home = Path.home()
        
        if system == "Windows":
            return str(home / ".local" / "bin" / "adb")
        elif system == "Darwin":  # macOS
            return str(home / ".local" / "bin" / "adb")
        else:  # Linux
            return str(home / ".local" / "bin" / "adb")
    
    def get_download_url(self) -> Optional[str]:
        """Get download URL for current platform"""
        if self.system not in self.DOWNLOAD_URLS:
            logger.error(f"Unsupported platform: {self.system}")
            return None
        
        # For macOS, both arm64 and x86_64 use the same URL
        if self.system == "Darwin":
            return self.DOWNLOAD_URLS["Darwin"]["arm64"]
        
        # For other platforms, use x86_64
        if "x86_64" in self.DOWNLOAD_URLS.get(self.system, {}):
            return self.DOWNLOAD_URLS[self.system]["x86_64"]
        
        logger.error(f"Unsupported architecture: {self.machine} on {self.system}")
        return None
    
    def download_platform_tools(self) -> Optional[str]:
        """
        Download platform tools zip file
        
        Returns:
            Path to downloaded zip file or None
        """
        url = self.get_download_url()
        if not url:
            return None
        
        zip_path = os.path.join(self.install_dir, "platform-tools.zip")
        logger.info(f"Downloading platform tools from {url}...")
        
        try:
            urllib.request.urlretrieve(url, zip_path)
            logger.info(f"Downloaded to {zip_path}")
            return zip_path
        except Exception as e:
            logger.error(f"Error downloading platform tools: {e}")
            return None
    
    def extract_platform_tools(self, zip_path: str) -> bool:
        """
        Extract platform tools zip file
        
        Args:
            zip_path: Path to zip file
            
        Returns:
            True if successful
        """
        try:
            extract_dir = os.path.join(self.install_dir, "extracted")
            Path(extract_dir).mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Extracting {zip_path}...")
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Find platform-tools directory
            platform_tools_dir = None
            for root, dirs, files in os.walk(extract_dir):
                if "platform-tools" in dirs:
                    platform_tools_dir = os.path.join(root, "platform-tools")
                    break
            
            if not platform_tools_dir:
                logger.error("Could not find platform-tools directory in extracted files")
                return False
            
            # Move platform-tools to install directory
            final_dir = os.path.join(self.install_dir, "platform-tools")
            if os.path.exists(final_dir):
                import shutil
                shutil.rmtree(final_dir)
            
            shutil.move(platform_tools_dir, final_dir)
            
            # Clean up
            shutil.rmtree(extract_dir)
            os.remove(zip_path)
            
            logger.info(f"Extracted to {final_dir}")
            return True
        except Exception as e:
            logger.error(f"Error extracting platform tools: {e}")
            return False
    
    def get_adb_path(self) -> Optional[str]:
        """
        Get ADB executable path after installation
        
        Returns:
            Path to ADB executable or None
        """
        adb_name = "adb.exe" if self.system == "Windows" else "adb"
        adb_path = os.path.join(self.install_dir, "platform-tools", adb_name)
        
        if os.path.exists(adb_path):
            # Make executable on Unix systems
            if self.system != "Windows":
                os.chmod(adb_path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
            return adb_path
        
        return None
    
    def install(self) -> Optional[str]:
        """
        Install ADB automatically
        
        Returns:
            Path to ADB executable if successful, None otherwise
        """
        logger.info(f"Installing ADB to {self.install_dir}...")
        
        # Download
        zip_path = self.download_platform_tools()
        if not zip_path:
            return None
        
        # Extract
        if not self.extract_platform_tools(zip_path):
            return None
        
        # Get ADB path
        adb_path = self.get_adb_path()
        if adb_path:
            logger.info(f"ADB installed successfully at {adb_path}")
            return adb_path
        
        return None
    
    def add_to_path(self, adb_path: str) -> bool:
        """
        Add ADB to PATH (optional, for convenience)
        
        Args:
            adb_path: Path to ADB executable
            
        Returns:
            True if successful
        """
        try:
            adb_dir = os.path.dirname(adb_path)
            
            if self.system == "Windows":
                # Add to user PATH on Windows
                import winreg
                key = winreg.OpenKey(
                    winreg.HKEY_CURRENT_USER,
                    "Environment",
                    0,
                    winreg.KEY_READ | winreg.KEY_WRITE
                )
                try:
                    current_path = winreg.QueryValueEx(key, "Path")[0]
                    if adb_dir not in current_path:
                        new_path = f"{current_path};{adb_dir}"
                        winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)
                        logger.info("Added ADB to Windows PATH (restart terminal to use)")
                finally:
                    winreg.CloseKey(key)
            else:
                # Add to shell profile on Unix
                shell = os.environ.get("SHELL", "/bin/bash")
                profile_file = os.path.expanduser("~/.bashrc") if "bash" in shell else os.path.expanduser("~/.zshrc")
                
                export_line = f'\nexport PATH="$PATH:{adb_dir}"\n'
                
                # Check if already added
                if os.path.exists(profile_file):
                    with open(profile_file, "r") as f:
                        if adb_dir in f.read():
                            logger.info("ADB already in PATH")
                            return True
                
                # Add to profile
                with open(profile_file, "a") as f:
                    f.write(export_line)
                
                logger.info(f"Added ADB to PATH in {profile_file} (restart terminal or run: source {profile_file})")
            
            return True
        except Exception as e:
            logger.warning(f"Could not add ADB to PATH: {e}")
            return False

