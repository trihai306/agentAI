"""ADB client wrapper for executing ADB commands"""
import subprocess
import shutil
import platform
import os
from typing import List, Dict, Optional, Tuple
import logging

from .adb_installer import ADBInstaller

logger = logging.getLogger(__name__)


class ADBClient:
    """Wrapper for ADB commands"""

    def __init__(self, adb_path: Optional[str] = None, auto_install: bool = True, install_dir: Optional[str] = None):
        """
        Initialize ADB client

        Args:
            adb_path: Path to ADB executable. If None, auto-detect.
            auto_install: Automatically install ADB if not found
            install_dir: Directory to install ADB if auto-installing
        """
        if adb_path:
            self.adb_path = adb_path
        else:
            # Try to detect
            self.adb_path = self._detect_adb_path()

            # If not found and auto_install is enabled, try to install
            if not self.adb_path and auto_install:
                logger.info("ADB not found. Attempting to auto-install...")
                try:
                    installer = ADBInstaller(install_dir=install_dir)
                    installed_path = installer.install()
                    if installed_path:
                        self.adb_path = installed_path
                        logger.info(f"ADB auto-installed successfully at {self.adb_path}")
                        # Optionally add to PATH
                        installer.add_to_path(installed_path)
                    else:
                        raise RuntimeError("Failed to auto-install ADB. Please install Android SDK Platform Tools manually.")
                except Exception as e:
                    logger.error(f"Error during ADB auto-install: {e}")
                    raise RuntimeError(f"ADB not found and auto-install failed: {e}. Please install Android SDK Platform Tools manually.")

        if not self.adb_path:
            raise RuntimeError("ADB not found. Please install Android SDK Platform Tools or enable auto-install.")

        if not os.path.exists(self.adb_path):
            raise RuntimeError(f"ADB path does not exist: {self.adb_path}")

        logger.info(f"Using ADB at: {self.adb_path}")

        # Accessibility service settings - use ADB shell commands directly
        self.use_accessibility = True  # Use accessibility service by default (via ADB shell)

    @staticmethod
    def _detect_adb_path() -> Optional[str]:
        """Auto-detect ADB path"""
        # Check common locations
        adb_name = "adb.exe" if platform.system() == "Windows" else "adb"

        # First, check if adb is in PATH
        adb_in_path = shutil.which(adb_name)
        if adb_in_path:
            return adb_in_path

        # Check common installation paths
        system = platform.system()
        if system == "Windows":
            common_paths = [
                os.path.expanduser("~/AppData/Local/Android/Sdk/platform-tools/adb.exe"),
                "C:\\Android\\platform-tools\\adb.exe",
                "C:\\adb\\adb.exe",
            ]
        elif system == "Darwin":  # macOS
            common_paths = [
                os.path.expanduser("~/Library/Android/sdk/platform-tools/adb"),
                "/usr/local/bin/adb",
                "/opt/homebrew/bin/adb",
            ]
        else:  # Linux
            common_paths = [
                os.path.expanduser("~/Android/Sdk/platform-tools/adb"),
                "/usr/bin/adb",
                "/usr/local/bin/adb",
            ]

        for path in common_paths:
            if os.path.exists(path) and os.access(path, os.X_OK):
                return path

        # ADB not found - return None (auto-install will be handled in __init__)
        return None

    def _run_command(self, command: List[str], device_id: Optional[str] = None) -> Tuple[str, str, int]:
        """
        Run ADB command

        Args:
            command: Command arguments (without 'adb')
            device_id: Optional device ID to target specific device

        Returns:
            Tuple of (stdout, stderr, return_code)
        """
        full_command = [self.adb_path]
        if device_id:
            full_command.extend(["-s", device_id])
        full_command.extend(command)

        logger.debug(f"Running ADB command: {' '.join(full_command)}")

        try:
            result = subprocess.run(
                full_command,
                capture_output=True,
                text=True,
                timeout=30,
            )
            return result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired:
            logger.error(f"ADB command timed out: {' '.join(full_command)}")
            return "", "Command timed out", -1
        except Exception as e:
            logger.error(f"Error running ADB command: {e}")
            return "", str(e), -1

    def devices(self) -> List[Dict[str, str]]:
        """
        List connected devices

        Returns:
            List of device info dicts with keys: id, state, model, etc.
        """
        stdout, stderr, returncode = self._run_command(["devices", "-l"])
        if returncode != 0:
            logger.error(f"Failed to list devices: {stderr}")
            return []

        devices = []
        lines = stdout.strip().split("\n")[1:]  # Skip header

        for line in lines:
            if not line.strip():
                continue

            parts = line.split()
            if len(parts) < 2:
                continue

            device_id = parts[0]
            state = parts[1]

            # Parse additional info (model, etc.)
            device_info = {"id": device_id, "state": state}
            for part in parts[2:]:
                if ":" in part:
                    key, value = part.split(":", 1)
                    device_info[key] = value

            devices.append(device_info)

        return devices

    def shell(self, command: str, device_id: Optional[str] = None) -> Tuple[str, str, int]:
        """
        Execute shell command on device

        Args:
            command: Shell command to execute
            device_id: Optional device ID

        Returns:
            Tuple of (stdout, stderr, return_code)
        """
        return self._run_command(["shell", command], device_id)

    def screencap(self, device_id: str, output_path: Optional[str] = None) -> Optional[bytes]:
        """
        Capture screenshot

        Args:
            device_id: Device ID
            output_path: Optional path to save screenshot. If None, returns bytes.

        Returns:
            Screenshot bytes if output_path is None, else None
        """
        if output_path:
            # Save to file using shell command
            stdout, stderr, returncode = self.shell(
                f"screencap -p > {output_path}",
                device_id
            )
            return None if returncode == 0 else None
        else:
            # Get screenshot as bytes - MUST use binary mode (no text=True)
            # screencap outputs PNG binary data, not text
            try:
                result = subprocess.run(
                    [self.adb_path, "-s", device_id, "shell", "screencap", "-p"],
                    capture_output=True,
                    timeout=10,
                )
                if result.returncode == 0:
                    return result.stdout
                else:
                    logger.error(f"Screencap failed: {result.stderr.decode('utf-8', errors='ignore')}")
                    return None
            except subprocess.TimeoutExpired:
                logger.error(f"Screencap timed out for device {device_id}")
                return None
            except Exception as e:
                logger.error(f"Error capturing screenshot: {e}")
                return None

    def get_screen_size(self, device_id: str) -> Optional[Tuple[int, int]]:
        """
        Get device screen size

        Args:
            device_id: Device ID

        Returns:
            Tuple of (width, height) or None
        """
        stdout, stderr, returncode = self.shell(
            "wm size",
            device_id
        )
        if returncode != 0:
            return None

        # Parse output like "Physical size: 1080x2340"
        try:
            for line in stdout.split("\n"):
                if "Physical size:" in line:
                    size_str = line.split("Physical size:")[1].strip()
                    width, height = map(int, size_str.split("x"))
                    return (width, height)
        except Exception as e:
            logger.error(f"Error parsing screen size: {e}")

        return None

    def get_orientation(self, device_id: str) -> Optional[str]:
        """
        Get device orientation

        Args:
            device_id: Device ID

        Returns:
            "portrait" or "landscape" or None
        """
        stdout, stderr, returncode = self.shell(
            "dumpsys input | grep 'SurfaceOrientation' | head -1",
            device_id
        )
        if returncode != 0:
            # Try alternative method
            stdout, stderr, returncode = self.shell(
                "dumpsys display | grep 'mCurrentOrientation'",
                device_id
            )

        if returncode == 0 and stdout:
            # Parse orientation (0=portrait, 1=landscape, etc.)
            try:
                orientation = int(stdout.strip().split("=")[-1].strip())
                if orientation in [0, 2]:
                    return "portrait"
                elif orientation in [1, 3]:
                    return "landscape"
            except:
                pass

        return None

    def set_orientation(self, device_id: str, orientation: str) -> bool:
        """
        Set device orientation

        Args:
            device_id: Device ID
            orientation: "portrait" or "landscape"

        Returns:
            True if successful
        """
        if orientation == "portrait":
            cmd = "settings put system user_rotation 0"
        elif orientation == "landscape":
            cmd = "settings put system user_rotation 1"
        else:
            return False

        stdout, stderr, returncode = self.shell(cmd, device_id)
        return returncode == 0

    def input_tap(self, device_id: str, x: int, y: int) -> bool:
        """Tap at coordinates - uses ADB input tap (standard method)"""
        # Use standard ADB input tap (không cần accessibility service cho coordinates)
        stdout, stderr, returncode = self.shell(
            f"input tap {x} {y}",
            device_id
        )
        return returncode == 0

    def input_swipe(self, device_id: str, x1: int, y1: int, x2: int, y2: int, duration: int = 300) -> bool:
        """Swipe from (x1, y1) to (x2, y2) - uses ADB input swipe (standard method)"""
        # Use standard ADB input swipe (không cần accessibility service cho coordinates)
        stdout, stderr, returncode = self.shell(
            f"input swipe {x1} {y1} {x2} {y2} {duration}",
            device_id
        )
        return returncode == 0

    def input_text(self, device_id: str, text: str) -> bool:
        """
        Input text using ADB. Properly handles special characters.

        Args:
            device_id: Device ID
            text: Text to input

        Returns:
            True if successful
        """
        # Use standard ADB input text (không cần accessibility service cho text input)
        # ADB input text command requires proper handling of special characters
        # Method 1: Try using base64 encoding (more reliable for special chars)
        import base64
        try:
            text_bytes = text.encode('utf-8')
            text_b64 = base64.b64encode(text_bytes).decode('ascii')

            # Use shell to decode and pipe to input text
            cmd = f"echo '{text_b64}' | base64 -d | input text"
            stdout, stderr, returncode = self.shell(cmd, device_id)

            if returncode == 0:
                return True
        except Exception as e:
            logger.debug(f"Base64 method failed, trying direct method: {e}")

        # Method 2: Direct input with proper escaping
        # ADB input text handles most characters, but we need to escape shell special chars
        # The text itself is passed to input text, so we mainly need to escape for shell
        escaped = text.replace('\\', '\\\\').replace('$', '\\$').replace('`', '\\`')
        escaped = escaped.replace('"', '\\"').replace("'", "\\'").replace('\n', '\\n')

        # Use single quotes in shell command to minimize escaping issues
        cmd = f"input text '{escaped}'"
        stdout, stderr, returncode = self.shell(cmd, device_id)

        return returncode == 0

    def input_key(self, device_id: str, key_code: str) -> bool:
        """
        Press key using key code or key name

        Args:
            device_id: Device ID
            key_code: Key code (numeric) or key name (e.g., "BACK", "HOME")

        Returns:
            True if successful
        """
        # Comprehensive key code mapping
        key_map = {
            # Navigation keys
            "BACK": "4",
            "HOME": "3",
            "MENU": "82",
            "RECENT": "187",
            # D-Pad keys
            "DPAD_CENTER": "23",
            "DPAD_UP": "19",
            "DPAD_DOWN": "20",
            "DPAD_LEFT": "21",
            "DPAD_RIGHT": "22",
            # System keys
            "ENTER": "66",
            "DEL": "67",
            "DELETE": "67",
            "BACKSPACE": "67",
            "POWER": "26",
            "WAKEUP": "224",
            "SLEEP": "223",
            # Volume keys
            "VOLUME_UP": "24",
            "VOLUME_DOWN": "25",
            "VOLUME_MUTE": "164",
            # Media keys
            "MEDIA_PLAY_PAUSE": "85",
            "MEDIA_STOP": "86",
            "MEDIA_NEXT": "87",
            "MEDIA_PREVIOUS": "88",
            "MEDIA_REWIND": "89",
            "MEDIA_FAST_FORWARD": "90",
            # Number keys
            "KEYCODE_0": "7",
            "KEYCODE_1": "8",
            "KEYCODE_2": "9",
            "KEYCODE_3": "10",
            "KEYCODE_4": "11",
            "KEYCODE_5": "12",
            "KEYCODE_6": "13",
            "KEYCODE_7": "14",
            "KEYCODE_8": "15",
            "KEYCODE_9": "16",
        }

        # Convert key name to code if needed
        key = key_map.get(key_code.upper(), key_code)

        # Remove KEYCODE_ prefix if present (e.g., KEYCODE_BACK -> BACK)
        if key.startswith("KEYCODE_"):
            key = key[8:]
            key = key_map.get(key, key_code)

        # If still not numeric, try to use as-is (might be numeric string)
        try:
            # Try to convert to int to validate
            int(key)
        except ValueError:
            # If not numeric and not in map, try with KEYCODE_ prefix
            key = f"KEYCODE_{key}"

        # Use standard ADB input keyevent (không cần accessibility service cho key press)
        stdout, stderr, returncode = self.shell(
            f"input keyevent {key}",
            device_id
        )
        return returncode == 0

    def install_app(self, device_id: str, apk_path: str) -> bool:
        """Install APK"""
        stdout, stderr, returncode = self._run_command(
            ["install", apk_path],
            device_id
        )
        return returncode == 0

    def uninstall_app(self, device_id: str, package_name: str) -> bool:
        """Uninstall app"""
        stdout, stderr, returncode = self._run_command(
            ["uninstall", package_name],
            device_id
        )
        return returncode == 0

    def list_packages(self, device_id: str) -> List[str]:
        """List installed packages"""
        stdout, stderr, returncode = self.shell(
            "pm list packages",
            device_id
        )
        if returncode != 0:
            return []

        packages = []
        for line in stdout.split("\n"):
            if line.startswith("package:"):
                packages.append(line.replace("package:", "").strip())
        return packages

    def launch_app(self, device_id: str, package_name: str, activity: Optional[str] = None) -> bool:
        """
        Launch app. If activity is not provided, tries to find and launch main activity.

        Args:
            device_id: Device ID
            package_name: Package name
            activity: Optional activity name. If None, finds main launcher activity.

        Returns:
            True if successful
        """
        if activity:
            # Use provided activity
            if "/" in activity:
                cmd = f"am start -n {activity}"
            else:
                # If activity doesn't start with package, construct full path
                if activity.startswith("."):
                    activity = f"{package_name}{activity}"
                elif not activity.startswith(package_name):
                    activity = f"{package_name}/{activity}"
                cmd = f"am start -n {activity}"
        else:
            # Try to get main launcher activity using pm dump
            activity = None
            stdout, stderr, returncode = self.shell(
                f"pm dump {package_name}",
                device_id
            )

            if returncode == 0 and stdout:
                # Look for MAIN activity with LAUNCHER category
                lines = stdout.split("\n")
                in_main_section = False
                for i, line in enumerate(lines):
                    if "android.intent.action.MAIN" in line:
                        in_main_section = True
                        # Look ahead for activity name
                        for j in range(i, min(i + 10, len(lines))):
                            if package_name in lines[j] and "/" in lines[j]:
                                # Extract activity from line like "com.package/.Activity"
                                parts = lines[j].strip().split()
                                for part in parts:
                                    if package_name in part and "/" in part:
                                        activity = part.strip()
                                        # Clean up any trailing characters
                                        activity = activity.split()[0].split("}")[0].split(")")[0]
                                        break
                                if activity:
                                    break
                        if activity:
                            break

            if activity:
                cmd = f"am start -n {activity}"
            else:
                # Fallback: Try intent-based launch first
                cmd = f"am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n {package_name}/.MainActivity"
                stdout, stderr, returncode = self.shell(cmd, device_id)
                if returncode != 0:
                    # Last resort: Use monkey command
                    cmd = f"monkey -p {package_name} -c android.intent.category.LAUNCHER 1"
                    stdout, stderr, returncode = self.shell(cmd, device_id)
                    return returncode == 0

        stdout, stderr, returncode = self.shell(cmd, device_id)
        return returncode == 0

    def open_url(self, device_id: str, url: str) -> bool:
        """Open URL in browser"""
        stdout, stderr, returncode = self.shell(
            f"am start -a android.intent.action.VIEW -d {url}",
            device_id
        )
        return returncode == 0

    def wait_for_device(self, device_id: Optional[str] = None, timeout: int = 30) -> bool:
        """
        Wait for device to be in 'device' state

        Args:
            device_id: Optional device ID. If None, waits for any device.
            timeout: Timeout in seconds

        Returns:
            True if device is ready
        """
        import time
        start_time = time.time()

        while time.time() - start_time < timeout:
            devices = self.devices()
            if device_id:
                for device in devices:
                    if device["id"] == device_id and device["state"] == "device":
                        return True
            else:
                if any(d["state"] == "device" for d in devices):
                    return True
            time.sleep(1)

        return False

    def get_device_info(self, device_id: str) -> Optional[Dict[str, str]]:
        """
        Get detailed device information

        Args:
            device_id: Device ID

        Returns:
            Dict with device info (model, manufacturer, android_version, etc.) or None
        """
        info = {}

        # Get model
        stdout, stderr, returncode = self.shell("getprop ro.product.model", device_id)
        if returncode == 0:
            info["model"] = stdout.strip()

        # Get manufacturer
        stdout, stderr, returncode = self.shell("getprop ro.product.manufacturer", device_id)
        if returncode == 0:
            info["manufacturer"] = stdout.strip()

        # Get Android version
        stdout, stderr, returncode = self.shell("getprop ro.build.version.release", device_id)
        if returncode == 0:
            info["android_version"] = stdout.strip()

        # Get SDK version
        stdout, stderr, returncode = self.shell("getprop ro.build.version.sdk", device_id)
        if returncode == 0:
            info["sdk_version"] = stdout.strip()

        # Get device name
        stdout, stderr, returncode = self.shell("getprop ro.product.device", device_id)
        if returncode == 0:
            info["device"] = stdout.strip()

        # Get brand
        stdout, stderr, returncode = self.shell("getprop ro.product.brand", device_id)
        if returncode == 0:
            info["brand"] = stdout.strip()

        return info if info else None

    def get_battery_level(self, device_id: str) -> Optional[int]:
        """
        Get battery level (0-100)

        Args:
            device_id: Device ID

        Returns:
            Battery level (0-100) or None
        """
        stdout, stderr, returncode = self.shell(
            "dumpsys battery | grep level",
            device_id
        )
        if returncode == 0:
            try:
                for line in stdout.split("\n"):
                    if "level:" in line:
                        level = int(line.split(":")[1].strip())
                        return level
            except:
                pass
        return None

    def get_current_activity(self, device_id: str) -> Optional[str]:
        """
        Get current foreground activity

        Args:
            device_id: Device ID

        Returns:
            Activity name (package/activity) or None
        """
        stdout, stderr, returncode = self.shell(
            "dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp'",
            device_id
        )
        if returncode == 0:
            for line in stdout.split("\n"):
                if "mCurrentFocus" in line or "mFocusedApp" in line:
                    # Extract activity from line like "mCurrentFocus=Window{... com.package/.Activity}"
                    if "/" in line:
                        parts = line.split("/")
                        if len(parts) >= 2:
                            activity_part = parts[-1].split()[0].split("}")[0]
                            package_part = parts[-2].split()[-1]
                            return f"{package_part}/{activity_part}"
        return None

    def get_current_package(self, device_id: str) -> Optional[str]:
        """
        Get current foreground package name

        Args:
            device_id: Device ID

        Returns:
            Package name or None
        """
        activity = self.get_current_activity(device_id)
        if activity and "/" in activity:
            return activity.split("/")[0]
        return None

    def terminate_app(self, device_id: str, package_name: str) -> bool:
        """
        Force stop an app

        Args:
            device_id: Device ID
            package_name: Package name to terminate

        Returns:
            True if successful
        """
        stdout, stderr, returncode = self.shell(
            f"am force-stop {package_name}",
            device_id
        )
        return returncode == 0

    def get_app_info(self, device_id: str, package_name: str) -> Optional[Dict[str, str]]:
        """
        Get app information

        Args:
            device_id: Device ID
            package_name: Package name

        Returns:
            Dict with app info or None
        """
        info = {}

        # Get app label
        stdout, stderr, returncode = self.shell(
            f"pm dump {package_name} | grep -A 1 'Application Label'",
            device_id
        )
        if returncode == 0 and stdout:
            for line in stdout.split("\n"):
                if "Application Label" in line:
                    label = line.split("'")[1] if "'" in line else ""
                    info["label"] = label

        # Get version name
        stdout, stderr, returncode = self.shell(
            f"dumpsys package {package_name} | grep versionName",
            device_id
        )
        if returncode == 0 and stdout:
            for line in stdout.split("\n"):
                if "versionName" in line:
                    version = line.split("=")[-1].strip()
                    info["version"] = version

        # Get main activity
        stdout, stderr, returncode = self.shell(
            f"pm dump {package_name} | grep -A 5 MAIN",
            device_id
        )
        if returncode == 0 and stdout:
            for line in stdout.split("\n"):
                if package_name in line and "/" in line:
                    activity = line.strip().split()[0] if line.strip() else ""
                    if activity:
                        info["main_activity"] = activity

        return info if info else None

    def push(self, device_id: str, local_path: str, remote_path: str) -> bool:
        """
        Push file to device

        Args:
            device_id: Device ID
            local_path: Local file path
            remote_path: Remote file path on device

        Returns:
            True if successful
        """
        stdout, stderr, returncode = self._run_command(
            ["push", local_path, remote_path],
            device_id
        )
        return returncode == 0

    def pull(self, device_id: str, remote_path: str, local_path: str) -> bool:
        """
        Pull file from device

        Args:
            device_id: Device ID
            remote_path: Remote file path on device
            local_path: Local file path to save

        Returns:
            True if successful
        """
        stdout, stderr, returncode = self._run_command(
            ["pull", remote_path, local_path],
            device_id
        )
        return returncode == 0

    def input_roll(self, device_id: str, x: int, y: int, delta: int) -> bool:
        """
        Scroll/roll at coordinates (vertical scroll)

        Args:
            device_id: Device ID
            x: X coordinate
            y: Y coordinate
            delta: Scroll delta (positive = down, negative = up)

        Returns:
            True if successful
        """
        # Use swipe with small movement for scrolling
        if delta > 0:
            # Scroll down
            y2 = y + abs(delta)
        else:
            # Scroll up
            y2 = y - abs(delta)

        return self.input_swipe(device_id, x, y, x, y2, duration=300)

    def input_long_press(self, device_id: str, x: int, y: int, duration: int = 1000) -> bool:
        """
        Long press at coordinates

        Args:
            device_id: Device ID
            x: X coordinate
            y: Y coordinate
            duration: Duration in milliseconds (default 1000ms)

        Returns:
            True if successful
        """
        # Long press is implemented as swipe with same start and end coordinates
        return self.input_swipe(device_id, x, y, x, y, duration=duration)

    def launch_app_with_activity(self, device_id: str, package_name: str, activity: str) -> bool:
        """
        Launch app with specific activity

        Args:
            device_id: Device ID
            package_name: Package name
            activity: Activity name (can be full path or just class name)

        Returns:
            True if successful
        """
        # If activity doesn't start with package, prepend it
        if not activity.startswith(package_name):
            if activity.startswith("."):
                activity = f"{package_name}{activity}"
            else:
                activity = f"{package_name}/{activity}"
        else:
            if "/" not in activity:
                activity = activity.replace(".", "/", 1)

        cmd = f"am start -n {activity}"
        stdout, stderr, returncode = self.shell(cmd, device_id)
        return returncode == 0

    # ========== Accessibility Service Methods (via ADB shell) ==========

    def accessibility_click_element(self, device_id: str, resource_id: Optional[str] = None,
                                     text: Optional[str] = None, description: Optional[str] = None) -> bool:
        """
        Click element using uiautomator dump + coordinates (accessibility service via ADB shell)
        Không cần cài app, sử dụng uiautomator dump để tìm element, sau đó click tại coordinates

        Args:
            device_id: Device ID
            resource_id: Resource ID (e.g., "com.example:id/button")
            text: Text content
            description: Content description

        Returns:
            True if successful
        """
        try:
            # Sử dụng UIAutomator để tìm element (đã có sẵn)
            # Method này sẽ được gọi từ interaction_tools sau khi đã tìm được element
            # Nên ở đây chỉ cần return False để fallback về coordinate-based click
            # (element đã được tìm và có coordinates từ UIAutomator dump)
            return False
        except Exception as e:
            logger.debug(f"Error in accessibility_click_element: {e}")
            return False

    def accessibility_get_elements(self, device_id: str) -> Optional[List[Dict]]:
        """
        Get UI elements using uiautomator dump (accessibility service via ADB shell)
        Không cần cài app, sử dụng uiautomator dump có sẵn

        Args:
            device_id: Device ID

        Returns:
            List of elements or None (sẽ được parse từ XML dump)
        """
        # This will be handled by UIAutomator class which already uses uiautomator dump
        # Return None to indicate we should use the existing uiautomator dump method
        return None

