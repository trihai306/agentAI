"""UI Automator wrapper for dumping and parsing UI hierarchy"""
import tempfile
import os
import uuid
from typing import Optional
from lxml import etree
import logging

from .adb_client import ADBClient

logger = logging.getLogger(__name__)


class UIAutomator:
    """Wrapper for UI Automator commands"""

    def __init__(self, adb_client: ADBClient):
        """
        Initialize UI Automator wrapper

        Args:
            adb_client: ADBClient instance
        """
        self.adb = adb_client
        self.use_accessibility = True  # Use uiautomator dump (accessibility service via ADB shell)

    def dump_hierarchy(self, device_id: str) -> Optional[str]:
        """
        Dump UI hierarchy to XML string

        Tries multiple approaches:
        1. Direct stdout dump (if supported)
        2. Dump to /sdcard/ then cat (most reliable)
        3. Dump to /data/local/tmp/ then cat (fallback)

        Args:
            device_id: Device ID

        Returns:
            XML string of UI hierarchy or None
        """
        # Method 1: Try direct stdout dump (may not work on all devices)
        try:
            stdout, stderr, returncode = self.adb.shell(
                "uiautomator dump /dev/stdout 2>/dev/null",
                device_id
            )
            if returncode == 0 and stdout and stdout.strip().startswith('<?xml'):
                logger.debug("Successfully dumped UI hierarchy via stdout")
                return stdout
        except Exception as e:
            logger.debug(f"Direct stdout dump not supported: {e}")

        # Method 2: Dump to file then cat (more reliable)
        unique_id = str(uuid.uuid4())[:8]
        device_tmp_paths = [
            f"/sdcard/ui_dump_{unique_id}.xml",
            f"/data/local/tmp/ui_dump_{unique_id}.xml"
        ]

        for device_tmp_path in device_tmp_paths:
            try:
                # Step 1: Dump UI hierarchy to file on device
                stdout, stderr, returncode = self.adb.shell(
                    f"uiautomator dump {device_tmp_path}",
                    device_id
                )

                if returncode != 0:
                    logger.debug(f"Failed to dump to {device_tmp_path}: {stderr}")
                    continue

                # Step 2: Read file content directly via shell (cat) - no need to pull to local
                stdout, stderr, returncode = self.adb.shell(
                    f"cat {device_tmp_path}",
                    device_id
                )

                if returncode == 0 and stdout and stdout.strip().startswith('<?xml'):
                    xml_content = stdout

                    # Step 3: Clean up device file (best effort)
                    try:
                        self.adb.shell(f"rm {device_tmp_path}", device_id)
                    except:
                        pass

                    logger.debug(f"Successfully dumped UI hierarchy via {device_tmp_path}")
                    return xml_content
                else:
                    logger.warning(f"Failed to read UI hierarchy file: {stderr}")
                    # Try to clean up device file
                    try:
                        self.adb.shell(f"rm {device_tmp_path}", device_id)
                    except:
                        pass
                    continue

            except Exception as e:
                logger.warning(f"Error with path {device_tmp_path}: {e}")
                continue

        # All methods failed
        logger.error("Failed to dump UI hierarchy: All methods failed")
        return None

    def get_hierarchy_xml(self, device_id: str) -> Optional[etree.Element]:
        """
        Get UI hierarchy as parsed XML element

        Args:
            device_id: Device ID

        Returns:
            Parsed XML element tree or None
        """
        xml_string = self.dump_hierarchy(device_id)
        if not xml_string:
            return None

        try:
            # Parse XML
            root = etree.fromstring(xml_string.encode('utf-8'))
            return root
        except Exception as e:
            logger.error(f"Error parsing UI hierarchy XML: {e}")
            return None

    def find_element_by_resource_id(self, device_id: str, resource_id: str) -> Optional[dict]:
        """
        Find element by resource ID

        Args:
            device_id: Device ID
            resource_id: Resource ID to find

        Returns:
            Element info dict or None
        """
        root = self.get_hierarchy_xml(device_id)
        if root is None:
            return None

        # Search for element with matching resource-id
        for elem in root.iter():
            if elem.get('resource-id') == resource_id:
                return self._element_to_dict(elem)

        return None

    def find_element_by_text(self, device_id: str, text: str, exact: bool = False) -> Optional[dict]:
        """
        Find element by text

        Args:
            device_id: Device ID
            text: Text to find
            exact: If True, exact match. If False, partial match.

        Returns:
            Element info dict or None
        """
        root = self.get_hierarchy_xml(device_id)
        if root is None:
            return None

        text_lower = text.lower()

        # Search for element with matching text
        for elem in root.iter():
            elem_text = elem.get('text', '')
            elem_content_desc = elem.get('content-desc', '')

            if exact:
                if elem_text == text or elem_content_desc == text:
                    return self._element_to_dict(elem)
            else:
                if text_lower in elem_text.lower() or text_lower in elem_content_desc.lower():
                    return self._element_to_dict(elem)

        return None

    def find_element_by_description(self, device_id: str, description: str, exact: bool = False) -> Optional[dict]:
        """
        Find element by content description

        Args:
            device_id: Device ID
            description: Content description to find
            exact: If True, exact match. If False, partial match.

        Returns:
            Element info dict or None
        """
        root = self.get_hierarchy_xml(device_id)
        if root is None:
            return None

        desc_lower = description.lower()

        # Search for element with matching content-desc
        for elem in root.iter():
            elem_desc = elem.get('content-desc', '')

            if exact:
                if elem_desc == description:
                    return self._element_to_dict(elem)
            else:
                if desc_lower in elem_desc.lower():
                    return self._element_to_dict(elem)

        return None

    def find_elements_by_class(self, device_id: str, class_name: str) -> list:
        """
        Find all elements by class name

        Args:
            device_id: Device ID
            class_name: Class name (e.g., 'android.widget.Button')

        Returns:
            List of element info dicts
        """
        root = self.get_hierarchy_xml(device_id)
        if root is None:
            return []

        elements = []
        for elem in root.iter():
            if elem.get('class') == class_name:
                elements.append(self._element_to_dict(elem))

        return elements

    def _element_to_dict(self, elem: etree.Element) -> dict:
        """
        Convert XML element to dict

        Args:
            elem: XML element

        Returns:
            Element info dict
        """
        bounds = elem.get('bounds', '')
        x1, y1, x2, y2 = self._parse_bounds(bounds)

        return {
            'class': elem.get('class', ''),
            'resource_id': elem.get('resource-id', ''),
            'text': elem.get('text', ''),
            'content_desc': elem.get('content-desc', ''),
            'package': elem.get('package', ''),
            'bounds': bounds,
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2,
            'center_x': (x1 + x2) // 2 if x1 and x2 else None,
            'center_y': (y1 + y2) // 2 if y1 and y2 else None,
            'clickable': elem.get('clickable', 'false').lower() == 'true',
            'enabled': elem.get('enabled', 'true').lower() == 'true',
            'focusable': elem.get('focusable', 'false').lower() == 'true',
        }

    @staticmethod
    def _parse_bounds(bounds_str: str) -> tuple:
        """
        Parse bounds string like "[x1,y1][x2,y2]" to coordinates

        Args:
            bounds_str: Bounds string

        Returns:
            Tuple of (x1, y1, x2, y2)
        """
        try:
            # Format: [x1,y1][x2,y2]
            bounds_str = bounds_str.strip()
            if not bounds_str.startswith('[') or ']' not in bounds_str:
                return (None, None, None, None)

            # Split into two parts
            parts = bounds_str.split('][')
            if len(parts) != 2:
                return (None, None, None, None)

            # Parse first coordinate [x1,y1
            part1 = parts[0].replace('[', '').replace(']', '')
            x1, y1 = map(int, part1.split(','))

            # Parse second coordinate x2,y2]
            part2 = parts[1].replace('[', '').replace(']', '')
            x2, y2 = map(int, part2.split(','))

            return (x1, y1, x2, y2)
        except Exception as e:
            logger.error(f"Error parsing bounds '{bounds_str}': {e}")
            return (None, None, None, None)

    def list_all_elements(self, device_id: str, interactive_only: bool = True) -> list:
        """
        List elements in UI hierarchy - uses accessibility service if available, otherwise uiautomator dump

        Args:
            device_id: Device ID
            interactive_only: If True, only return elements that can be interacted with
                            (clickable, enabled, or focusable). If False, return all elements.

        Returns:
            List of element info dicts (filtered to interactive elements if interactive_only=True)
        """
        # Use uiautomator dump (accessibility service via ADB shell - không cần cài app)
        root = self.get_hierarchy_xml(device_id)
        if root is None:
            return []

        elements = []
        for elem in root.iter():
            # Skip root node if it's just a container
            if elem.tag == 'hierarchy':
                continue

            element_dict = self._element_to_dict(elem)

            # Only include elements with class
            if not element_dict['class']:
                continue

            # Filter: Only include interactive elements if interactive_only=True
            if interactive_only:
                # Element is interactive if it's clickable, enabled, or focusable
                is_interactive = (
                    element_dict.get('clickable', False) or
                    element_dict.get('focusable', False) or
                    element_dict.get('enabled', True)  # Enabled elements can be interacted with
                )

                # Also include elements with text or content_desc (likely interactive)
                has_text = bool(element_dict.get('text', '').strip())
                has_desc = bool(element_dict.get('content_desc', '').strip())

                if not (is_interactive or has_text or has_desc):
                    continue

            elements.append(element_dict)

        return elements

