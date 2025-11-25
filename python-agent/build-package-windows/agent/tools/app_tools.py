"""App management tools"""
from typing import List, Dict
import logging

# Import function_tool decorator from agents package
# According to docs: https://openai.github.io/openai-agents-python/tools/
# ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/
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


def create_app_tools(adb_client: ADBClient) -> List:
    """
    Create app management tools for mobile device.

    According to OpenAI Agents SDK documentation:
    - Tools: https://openai.github.io/openai-agents-python/tools/
    - ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/

    Note: Tool functions can optionally accept ToolContext as the first parameter
    to access tool metadata (tool_name, tool_call_id, tool_arguments, context, usage).
    """

    @function_tool
    async def mobile_launch_app(device: str, package_name: str) -> Dict:
        """
        Launch an app on mobile device.

        Args:
            device: Device ID
            package_name: Package name of the app to launch

        Returns:
            Dict with success status
        """
        try:
            success = adb_client.launch_app(device, package_name)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error launching app: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_open_url(device: str, url: str) -> Dict:
        """
        Open a URL in browser on device.

        Args:
            device: Device ID
            url: The URL to open

        Returns:
            Dict with success status
        """
        try:
            success = adb_client.open_url(device, url)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error opening URL: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_list_apps(device: str) -> Dict:
        """
        List all the installed apps on the device.

        Args:
            device: Device ID

        Returns:
            Dict with list of apps
        """
        try:
            packages = adb_client.list_packages(device)
            return {
                "success": True,
                "apps": [{"package_name": pkg} for pkg in packages],
                "count": len(packages),
            }
        except Exception as e:
            logger.error(f"Error listing apps: {e}")
            return {"success": False, "error": str(e), "apps": []}

    @function_tool
    async def mobile_terminate_app(device: str, package_name: str) -> Dict:
        """
        Force stop/terminate an app on mobile device.

        Args:
            device: Device ID
            package_name: Package name of the app to terminate

        Returns:
            Dict with success status
        """
        try:
            success = adb_client.terminate_app(device, package_name)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error terminating app: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_get_current_app(device: str) -> Dict:
        """
        Get the currently running foreground app on the device.

        Args:
            device: Device ID

        Returns:
            Dict with current app info (package, activity)
        """
        try:
            package = adb_client.get_current_package(device)
            activity = adb_client.get_current_activity(device)

            if package:
                return {
                    "success": True,
                    "package": package,
                    "activity": activity,
                }
            else:
                return {"success": False, "error": "No app is currently running"}
        except Exception as e:
            logger.error(f"Error getting current app: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_get_app_info(device: str, package_name: str) -> Dict:
        """
        Get detailed information about an installed app.

        Args:
            device: Device ID
            package_name: Package name of the app

        Returns:
            Dict with app information (label, version, main_activity, etc.)
        """
        try:
            info = adb_client.get_app_info(device, package_name)
            if info:
                return {
                    "success": True,
                    "package": package_name,
                    **info,
                }
            else:
                return {"success": False, "error": f"App {package_name} not found or no info available"}
        except Exception as e:
            logger.error(f"Error getting app info: {e}")
            return {"success": False, "error": str(e)}

    # Return decorated functions - Agent will automatically use them as tools
    return [
        mobile_launch_app,
        mobile_open_url,
        mobile_list_apps,
        mobile_terminate_app,
        mobile_get_current_app,
        mobile_get_app_info,
    ]

