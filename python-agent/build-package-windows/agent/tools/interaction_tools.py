"""Interaction tools for clicking, swiping, typing - all based on elements"""
from typing import Dict, Optional
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
from ..adb.uiautomator import UIAutomator
from ..utils.element_parser import ElementParser

logger = logging.getLogger(__name__)


def create_interaction_tools(adb_client: ADBClient, ui_automator: UIAutomator) -> list:
    """
    Create interaction tools for mobile device.

    According to OpenAI Agents SDK documentation:
    - Tools: https://openai.github.io/openai-agents-python/tools/
    - ToolContext: https://openai.github.io/openai-agents-python/ref/tool_context/

    Note: Tool functions can optionally accept ToolContext as the first parameter
    to access tool metadata (tool_name, tool_call_id, tool_arguments, context, usage).
    """

    @function_tool
    async def mobile_click_element(
        device: str,
        resource_id: Optional[str] = None,
        text: Optional[str] = None,
        description: Optional[str] = None,
        class_name: Optional[str] = None,
    ) -> Dict:
        """
        Click on an element on the screen. Finds element by resource-id, text, or description.

        Args:
            device: Device ID
            resource_id: Resource ID of element to click
            text: Text of element to click
            description: Content description of element to click
            class_name: Class name of element to click

        Returns:
            Dict with success status
        """
        try:
            # Validate that at least one search parameter is provided
            if not any([resource_id, text, description, class_name]):
                return {
                    "success": False,
                    "error": "At least one search parameter (resource_id, text, description, or class_name) must be provided"
                }

            # Get all elements
            elements = ui_automator.list_all_elements(device)
            if not elements:
                return {"success": False, "error": "No elements found on screen"}

            # Find matching element
            element = ElementParser.find_element(
                elements,
                resource_id=resource_id,
                text=text,
                description=description,
                class_name=class_name,
            )

            if not element:
                # Provide helpful error message with available elements
                search_params = []
                if resource_id:
                    search_params.append(f"resource_id={resource_id}")
                if text:
                    search_params.append(f"text={text}")
                if description:
                    search_params.append(f"description={description}")
                if class_name:
                    search_params.append(f"class_name={class_name}")

                return {
                    "success": False,
                    "error": f"Element not found with: {', '.join(search_params)}",
                    "hint": "Use mobile_list_elements_on_screen to see available elements"
                }

            # Check if element is clickable
            if not element.get("clickable", False):
                logger.warning(f"Element is not marked as clickable, but attempting click anyway")

            # Try accessibility service first (click by element properties)
            if hasattr(adb_client, 'accessibility_click_element') and adb_client.use_accessibility:
                success = adb_client.accessibility_click_element(
                    device,
                    resource_id=resource_id,
                    text=text,
                    description=description
                )
                if success:
                    return {
                        "success": True,
                        "element": ElementParser.format_element_info(element),
                        "method": "accessibility_service"
                    }
                # Fallback to coordinate-based click if accessibility service fails
                logger.debug("Accessibility click_element failed, falling back to coordinate-based click")

            # Get center coordinates for coordinate-based click
            center = ElementParser.get_element_center(element)
            if not center:
                return {"success": False, "error": "Could not determine element center coordinates"}

            x, y = center

            # Validate coordinates are within screen bounds
            screen_size = adb_client.get_screen_size(device)
            if screen_size:
                screen_width, screen_height = screen_size
                if x < 0 or x > screen_width or y < 0 or y > screen_height:
                    return {
                        "success": False,
                        "error": f"Element coordinates ({x}, {y}) are out of screen bounds ({screen_width}x{screen_height})"
                    }

            # Click at center (uses accessibility service if available, otherwise ADB)
            success = adb_client.input_tap(device, x, y)
            if not success:
                return {
                    "success": False,
                    "error": "Failed to execute tap command",
                    "element": ElementParser.format_element_info(element),
                    "coordinates": {"x": x, "y": y},
                }

            return {
                "success": success,
                "element": ElementParser.format_element_info(element),
                "coordinates": {"x": x, "y": y},
            }
        except Exception as e:
            logger.error(f"Error clicking element: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_swipe_element(
        device: str,
        from_resource_id: Optional[str] = None,
        from_text: Optional[str] = None,
        from_description: Optional[str] = None,
        to_resource_id: Optional[str] = None,
        to_text: Optional[str] = None,
        to_description: Optional[str] = None,
        direction: Optional[str] = None,
        distance: Optional[int] = None,
    ) -> Dict:
        """
        Swipe on the screen. Can swipe from one element to another, or swipe in a direction from an element.

        Args:
            device: Device ID
            from_resource_id: Resource ID of source element
            from_text: Text of source element
            from_description: Content description of source element
            to_resource_id: Resource ID of target element
            to_text: Text of target element
            to_description: Content description of target element
            direction: Direction to swipe: 'up', 'down', 'left', 'right' (if no target element)
            distance: Distance in pixels (if using direction)

        Returns:
            Dict with success status
        """
        try:
            # Get all elements
            elements = ui_automator.list_all_elements(device)
            if not elements:
                return {"success": False, "error": "No elements found on screen"}

            # Get screen size for direction-based swipes
            screen_size = adb_client.get_screen_size(device)
            if not screen_size:
                return {"success": False, "error": "Could not get screen size"}
            screen_width, screen_height = screen_size

            # Find source element
            from_element = None
            if from_resource_id or from_text or from_description:
                from_element = ElementParser.find_element(
                    elements,
                    resource_id=from_resource_id,
                    text=from_text,
                    description=from_description,
                )
                if not from_element:
                    return {"success": False, "error": "Source element not found"}

            # Determine start coordinates
            if from_element:
                start_center = ElementParser.get_element_center(from_element)
                if not start_center:
                    return {"success": False, "error": "Could not determine source element center"}
                x1, y1 = start_center
            else:
                # Use screen center as start
                x1, y1 = screen_width // 2, screen_height // 2

            # Determine end coordinates
            if to_resource_id or to_text or to_description:
                # Swipe to target element
                to_element = ElementParser.find_element(
                    elements,
                    resource_id=to_resource_id,
                    text=to_text,
                    description=to_description,
                )
                if not to_element:
                    return {"success": False, "error": "Target element not found"}

                end_center = ElementParser.get_element_center(to_element)
                if not end_center:
                    return {"success": False, "error": "Could not determine target element center"}
                x2, y2 = end_center
            elif direction:
                # Swipe in direction
                distance = distance or 400  # Default distance
                if direction == "up":
                    x2, y2 = x1, y1 - distance
                elif direction == "down":
                    x2, y2 = x1, y1 + distance
                elif direction == "left":
                    x2, y2 = x1 - distance, y1
                elif direction == "right":
                    x2, y2 = x1 + distance, y1
                else:
                    return {"success": False, "error": f"Invalid direction: {direction}"}
            else:
                return {"success": False, "error": "Must specify either target element or direction"}

            # Perform swipe
            success = adb_client.input_swipe(device, x1, y1, x2, y2, duration=300)
            return {
                "success": success,
                "from": {"x": x1, "y": y1},
                "to": {"x": x2, "y": y2},
            }
        except Exception as e:
            logger.error(f"Error swiping: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_double_tap_element(
        device: str,
        resource_id: Optional[str] = None,
        text: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict:
        """
        Double-tap on an element on the screen.

        Args:
            device: Device ID
            resource_id: Resource ID of element
            text: Text of element
            description: Content description of element

        Returns:
            Dict with success status
        """
        try:
            # Get all elements
            elements = ui_automator.list_all_elements(device)
            if not elements:
                return {"success": False, "error": "No elements found on screen"}

            # Find element
            element = ElementParser.find_element(
                elements,
                resource_id=resource_id,
                text=text,
                description=description,
            )

            if not element:
                return {"success": False, "error": "Element not found"}

            # Get center coordinates
            center = ElementParser.get_element_center(element)
            if not center:
                return {"success": False, "error": "Could not determine element center"}

            x, y = center

            # Double tap (tap twice quickly with small delay)
            import time
            success1 = adb_client.input_tap(device, x, y)
            time.sleep(0.15)  # Slightly longer delay for better double-tap recognition
            success2 = adb_client.input_tap(device, x, y)

            if not (success1 and success2):
                return {
                    "success": False,
                    "error": "Failed to execute double tap",
                    "element": ElementParser.format_element_info(element),
                    "coordinates": {"x": x, "y": y},
                }

            return {
                "success": True,
                "element": ElementParser.format_element_info(element),
                "coordinates": {"x": x, "y": y},
            }
        except Exception as e:
            logger.error(f"Error double tapping element: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_long_press_element(
        device: str,
        resource_id: Optional[str] = None,
        text: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict:
        """
        Long press on an element on the screen.

        Args:
            device: Device ID
            resource_id: Resource ID of element
            text: Text of element
            description: Content description of element

        Returns:
            Dict with success status
        """
        try:
            # Get all elements
            elements = ui_automator.list_all_elements(device)
            if not elements:
                return {"success": False, "error": "No elements found on screen"}

            # Find element
            element = ElementParser.find_element(
                elements,
                resource_id=resource_id,
                text=text,
                description=description,
            )

            if not element:
                return {"success": False, "error": "Element not found"}

            # Get center coordinates
            center = ElementParser.get_element_center(element)
            if not center:
                return {"success": False, "error": "Could not determine element center"}

            x, y = center

            # Long press using dedicated method (swipe with same start and end but longer duration)
            # Use input_long_press if available, otherwise use swipe
            if hasattr(adb_client, 'input_long_press'):
                success = adb_client.input_long_press(device, x, y, duration=1000)
            else:
                success = adb_client.input_swipe(device, x, y, x, y, duration=1000)

            if not success:
                return {
                    "success": False,
                    "error": "Failed to execute long press",
                    "element": ElementParser.format_element_info(element),
                    "coordinates": {"x": x, "y": y},
                }

            return {
                "success": success,
                "element": ElementParser.format_element_info(element),
                "coordinates": {"x": x, "y": y},
            }
        except Exception as e:
            logger.error(f"Error long pressing element: {e}")
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_type_keys(device: str, text: str, submit: bool = False) -> Dict:
        """
        Type text into the focused element.

        Args:
            device: Device ID
            text: Text to type
            submit: Whether to submit (press Enter after typing)

        Returns:
            Dict with success status
        """
        try:
            if not text:
                return {"success": False, "error": "Text cannot be empty"}

            success = adb_client.input_text(device, text)
            if not success:
                return {"success": False, "error": "Failed to input text"}

            if submit:
                submit_success = adb_client.input_key(device, "ENTER")
                return {
                    "success": success and submit_success,
                    "text_entered": success,
                    "submitted": submit_success
                }

            return {"success": success}
        except Exception as e:
            logger.error(f"Error typing keys: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    @function_tool
    async def mobile_press_button(device: str, button: str) -> Dict:
        """
        Press a button on device.

        Args:
            device: Device ID
            button: Button to press: BACK, HOME, VOLUME_UP, VOLUME_DOWN, ENTER, MENU, RECENT, POWER, etc.

        Returns:
            Dict with success status
        """
        try:
            if not button:
                return {"success": False, "error": "Button name cannot be empty"}

            # Validate button name
            valid_buttons = [
                "BACK", "HOME", "MENU", "RECENT", "ENTER", "DEL", "DELETE", "BACKSPACE",
                "POWER", "WAKEUP", "SLEEP", "VOLUME_UP", "VOLUME_DOWN", "VOLUME_MUTE",
                "DPAD_CENTER", "DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT",
                "MEDIA_PLAY_PAUSE", "MEDIA_STOP", "MEDIA_NEXT", "MEDIA_PREVIOUS"
            ]

            button_upper = button.upper()
            if button_upper not in valid_buttons and not button.isdigit():
                logger.warning(f"Button '{button}' not in known list, but attempting anyway")

            success = adb_client.input_key(device, button)
            if not success:
                return {"success": False, "error": f"Failed to press button: {button}"}

            return {"success": success, "button": button}
        except Exception as e:
            logger.error(f"Error pressing button: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # Return decorated functions - Agent will automatically use them as tools
    return [
        mobile_click_element,
        mobile_swipe_element,
        mobile_double_tap_element,
        mobile_long_press_element,
        mobile_type_keys,
        mobile_press_button,
    ]

