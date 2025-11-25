"""Screen tools for screenshots and UI hierarchy"""
from typing import Dict, List, Union
import os
import io
import logging

# Import function_tool decorator and ToolOutputImage from agents package
# According to docs: https://openai.github.io/openai-agents-python/tools/
# ToolOutputImage: https://openai.github.io/openai-agents-python/ref/tool/#agents.tool.ToolOutputImageDict
# ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/
try:
    from agents import function_tool
    from agents.tool import ToolOutputImage, ToolOutputText
    from agents.tool_context import ToolContext
except ImportError:
    try:
        from openai.agents import function_tool
        from openai.agents.tool import ToolOutputImage, ToolOutputText
        from openai.agents.tool_context import ToolContext
    except ImportError:
        raise ImportError("function_tool not found. Please install openai-agents package.")

try:
    from openai import OpenAI
except ImportError:
    raise ImportError("openai package not installed. Run: pip install openai")

from ..adb.adb_client import ADBClient
from ..adb.uiautomator import UIAutomator
from ..utils.screenshot import bytes_to_base64, resize_image

logger = logging.getLogger(__name__)


def create_screen_tools(adb_client: ADBClient, ui_automator: UIAutomator) -> List:
    """
    Create screen tools for mobile device.

    According to OpenAI Agents SDK documentation:
    - Tools: https://openai.github.io/openai-agents-python/tools/
    - ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/

    Note: Tool functions can optionally accept ToolContext as the first parameter
    to access tool metadata (tool_name, tool_call_id, tool_arguments, context, usage).
    """

    @function_tool
    async def mobile_take_screenshot(ctx: ToolContext, device: str) -> Union[ToolOutputImage, ToolOutputText]:
        """
        Take a screenshot of the mobile device and upload to OpenAI Files API.
        Returns ToolOutputImage with file_id to save tokens.

        According to OpenAI Agents SDK documentation:
        https://openai.github.io/openai-agents-python/ref/tool/#agents.tool.ToolOutputImageDict
        https://openai.github.io/openai-agents-python/ref/tool_context/

        Args:
            ctx: ToolContext containing context with API key
            device: Device ID

        Returns:
            ToolOutputImage with file_id (OpenAI file ID) when upload succeeds.
            ToolOutputText with error message if upload fails (never uses base64 fallback to avoid GPT-5 validation errors).
            ToolOutputText with error message if screenshot capture fails.
        """
        try:
            screenshot_bytes = adb_client.screencap(device)
            if not screenshot_bytes:
                return ToolOutputText(
                    text="Error: Failed to capture screenshot from device"
                )

            # Resize if too large (to save bandwidth and upload time)
            screenshot_bytes = resize_image(screenshot_bytes, max_width=1920, max_height=1080)

            # Get OpenAI API key from context (passed from frontend via Runner.run context)
            # Context should be a dict with 'api_key' key
            api_key = None
            if ctx.context and isinstance(ctx.context, dict):
                api_key = ctx.context.get("api_key")

            # Fallback to environment variable for backward compatibility
            if not api_key:
                api_key = os.environ.get("OPENAI_API_KEY")

            if not api_key:
                logger.error("❌ OpenAI API key not found in context or environment. Cannot upload screenshot.")
                # CRITICAL: Don't use base64 fallback - it causes GPT-5 validation errors
                # Return error message instead
                return ToolOutputText(
                    text="Error: OpenAI API key is required to upload screenshots. Please provide API key in context."
                )

            # Upload to OpenAI Files API
            # CRITICAL: Must always upload and use file_id - NEVER use base64 image_url
            # Base64 image_url causes GPT-5 validation errors when stored in session history
            # If upload fails, return error instead of base64 fallback
            max_retries = 3
            retry_delay = 1.0

            for attempt in range(max_retries):
                try:
                    client = OpenAI(api_key=api_key)

                    # Create file-like object from bytes
                    screenshot_file = io.BytesIO(screenshot_bytes)
                    screenshot_file.name = "screenshot.png"

                    # Upload file to OpenAI
                    # According to OpenAI API: files.create() for uploading files
                    uploaded_file = client.files.create(
                        file=screenshot_file,
                        purpose="vision"  # Use "vision" purpose for image files
                    )

                    file_id = uploaded_file.id
                    logger.info(f"✅ Screenshot uploaded to OpenAI Files API: file_id={file_id} (attempt {attempt + 1})")

                    # CRITICAL: Only return file_id - NEVER include image_url
                    # When file_id is present, SDK uses it and won't need image_url
                    # image_url is sent separately to frontend via WebSocket (see http_server.py)
                    # This prevents GPT-5 from seeing base64 strings in session history
                    return ToolOutputImage(
                        file_id=file_id,
                        detail="auto"  # Let SDK automatically decide detail level
                    )
                except Exception as upload_error:
                    error_str = str(upload_error).lower()
                    is_retryable = (
                        'rate limit' in error_str or
                        'timeout' in error_str or
                        'connection' in error_str or
                        '429' in error_str or
                        '503' in error_str or
                        '502' in error_str
                    )

                    if is_retryable and attempt < max_retries - 1:
                        # Retry-able error - wait and retry
                        import time
                        logger.warning(f"⚠️ Upload attempt {attempt + 1} failed (retryable): {upload_error}. Retrying in {retry_delay}s...")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        continue
                    else:
                        # Non-retryable error or max retries reached
                        logger.error(f"❌ Failed to upload screenshot to OpenAI after {attempt + 1} attempts: {upload_error}", exc_info=True)
                        logger.error(f"   CRITICAL: Cannot use base64 fallback as it causes GPT-5 validation errors.")

                        # Return error message instead of base64
                        # This prevents corrupted base64 from being stored in session
                        return ToolOutputText(
                            text=f"Error: Failed to upload screenshot to OpenAI after {attempt + 1} attempts. Please check API key and network connection. Error: {str(upload_error)[:200]}"
                        )
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}", exc_info=True)
            return ToolOutputText(
                text=f"Error taking screenshot: {str(e)}"
            )

    @function_tool
    async def mobile_list_elements_on_screen(device: str) -> Dict:
        """
        List interactive elements on screen (clickable, enabled, or focusable elements).
        Only returns elements that can be interacted with to reduce noise and focus on actionable UI elements.

        Args:
            device: Device ID

        Returns:
            Dict with list of interactive elements only
        """
        try:
            # Only get interactive elements (clickable, enabled, focusable, or have text/description)
            elements = ui_automator.list_all_elements(device, interactive_only=True)

            # Format elements for response - prioritize actionable information
            formatted_elements = []
            for elem in elements:
                # Only include elements that have meaningful information
                has_text = bool(elem.get("text", "").strip())
                has_desc = bool(elem.get("content_desc", "").strip())
                has_resource_id = bool(elem.get("resource_id", "").strip())
                is_clickable = elem.get("clickable", False)
                is_focusable = elem.get("focusable", False)

                # Skip elements without any identifying information
                if not (has_text or has_desc or has_resource_id or is_clickable or is_focusable):
                    continue

                formatted_elem = {
                    "class": elem.get("class", ""),
                    "resource_id": elem.get("resource_id", ""),
                    "text": elem.get("text", ""),
                    "content_desc": elem.get("content_desc", ""),
                    "bounds": elem.get("bounds", ""),
                    "center_x": elem.get("center_x"),
                    "center_y": elem.get("center_y"),
                    "clickable": elem.get("clickable", False),
                    "enabled": elem.get("enabled", True),
                    "focusable": elem.get("focusable", False),
                }
                formatted_elements.append(formatted_elem)

            return {
                "success": True,
                "elements": formatted_elements,
                "count": len(formatted_elements),
                "note": "Only interactive elements (clickable, enabled, focusable, or with text/description) are shown"
            }
        except Exception as e:
            logger.error(f"Error listing elements: {e}", exc_info=True)
            return {"success": False, "error": str(e), "elements": []}

    @function_tool
    async def mobile_save_screenshot(device: str, save_to: str) -> Dict:
        """
        Take a screenshot and save it to a file.

        Args:
            device: Device ID
            save_to: Path to save screenshot file (local path)

        Returns:
            Dict with success status and file path
        """
        try:
            # Get screenshot bytes
            screenshot_bytes = adb_client.screencap(device)
            if not screenshot_bytes:
                return {"success": False, "error": "Failed to capture screenshot"}

            # Ensure directory exists
            import os
            save_dir = os.path.dirname(save_to)
            if save_dir and not os.path.exists(save_dir):
                os.makedirs(save_dir, exist_ok=True)

            # Save to file
            with open(save_to, 'wb') as f:
                f.write(screenshot_bytes)

            file_size = len(screenshot_bytes)
            return {
                "success": True,
                "file_path": save_to,
                "file_size": file_size,
                "format": "PNG",
                "message": f"Screenshot saved successfully to {save_to}",
            }
        except Exception as e:
            logger.error(f"Error saving screenshot: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # Return decorated functions - Agent will automatically use them as tools
    return [
        mobile_take_screenshot,
        mobile_list_elements_on_screen,
        mobile_save_screenshot,
    ]

