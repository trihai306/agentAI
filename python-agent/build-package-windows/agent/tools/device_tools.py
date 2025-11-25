"""Device management tools"""
from typing import List, Dict, Optional
import logging

# Import function_tool decorator from agents package
# According to docs: https://openai.github.io/openai-agents-python/tools/
# ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/
# We use @function_tool decorator which automatically parses function signature
try:
    from agents import function_tool
    from agents.tool_context import ToolContext
except ImportError:
    try:
        from openai.agents import function_tool
        from openai.agents.tool_context import ToolContext
    except ImportError:
        raise ImportError("function_tool not found. Please install openai-agents package.")

from ..adb.adb_client import ADBClient

logger = logging.getLogger(__name__)


def create_device_tools(adb_client: ADBClient) -> List:
    """
    Create device management tools for mobile device.

    According to OpenAI Agents SDK documentation:
    - Tools: https://openai.github.io/openai-agents-python/tools/
    - ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/

    Note: Tool functions can optionally accept ToolContext as the first parameter
    to access tool metadata (tool_name, tool_call_id, tool_arguments, context, usage).
    """

    @function_tool
    async def mobile_list_available_devices() -> Dict:
        """
        List all available Android devices connected via ADB.

        Returns:
            Dict with 'devices' list containing device info
        """
        try:
            devices = adb_client.devices()
            return {
                "success": True,
                "devices": [
                    {
                        "id": d["id"],
                        "state": d["state"],
                        "model": d.get("model", "Unknown"),
                        "device": d.get("device", "Unknown"),
                    }
                    for d in devices
                    if d["state"] == "device"  # Only return connected devices
                ],
            }
        except Exception as e:
            logger.error(f"Error listing devices: {e}")
            return {"success": False, "error": str(e), "devices": []}

    @function_tool
    async def mobile_get_screen_size(device: str) -> Dict:
        """
        Get the screen size of the mobile device in pixels.

        Args:
            device: Device ID

        Returns:
            Dict with width and height
        """
        try:
            size = adb_client.get_screen_size(device)
            if size:
                width, height = size
                return {
                    "success": True,
                    "width": width,
                    "height": height,
                }
            else:
                return {"success": False, "error": "Failed to get screen size"}
        except Exception as e:
            logger.error(f"Error getting screen size: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_set_orientation(device: str, orientation: str) -> Dict:
        """
        Change the screen orientation of the device.

        Args:
            device: Device ID
            orientation: 'portrait' or 'landscape'

        Returns:
            Dict with success status
        """
        try:
            if orientation not in ["portrait", "landscape"]:
                return {"success": False, "error": "Orientation must be 'portrait' or 'landscape'"}

            success = adb_client.set_orientation(device, orientation)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error setting orientation: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_get_orientation(device: str) -> Dict:
        """
        Get the current screen orientation of the device.

        Args:
            device: Device ID

        Returns:
            Dict with orientation
        """
        try:
            orientation = adb_client.get_orientation(device)
            if orientation:
                return {"success": True, "orientation": orientation}
            else:
                return {"success": False, "error": "Failed to get orientation"}
        except Exception as e:
            logger.error(f"Error getting orientation: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_get_device_info(device: str) -> Dict:
        """
        Get detailed information about the device (model, manufacturer, Android version, etc.).

        Args:
            device: Device ID

        Returns:
            Dict with device information
        """
        try:
            info = adb_client.get_device_info(device)
            if info:
                return {"success": True, **info}
            else:
                return {"success": False, "error": "Failed to get device info"}
        except Exception as e:
            logger.error(f"Error getting device info: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_get_battery_level(device: str) -> Dict:
        """
        Get the battery level of the device (0-100).

        Args:
            device: Device ID

        Returns:
            Dict with battery level
        """
        try:
            level = adb_client.get_battery_level(device)
            if level is not None:
                return {"success": True, "battery_level": level}
            else:
                return {"success": False, "error": "Failed to get battery level"}
        except Exception as e:
            logger.error(f"Error getting battery level: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_wait_for_device(device: Optional[str] = None, timeout: int = 30) -> Dict:
        """
        Wait for device to be ready (in 'device' state).

        Args:
            device: Optional device ID. If not specified, waits for any device.
            timeout: Timeout in seconds (default: 30)

        Returns:
            Dict with success status
        """
        try:
            success = adb_client.wait_for_device(device, timeout)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error waiting for device: {e}")
            return {"success": False, "error": str(e)}

    # Return decorated functions - Agent will automatically use them as tools
    # According to docs: "You can pass the decorated functions to the list of tools"
    return [
        mobile_list_available_devices,
        mobile_get_screen_size,
        mobile_set_orientation,
        mobile_get_orientation,
        mobile_get_device_info,
        mobile_get_battery_level,
        mobile_wait_for_device,
    ]

