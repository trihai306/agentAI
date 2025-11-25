"""Element parser for UI hierarchy"""
from typing import List, Dict, Optional
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)


class ElementParser:
    """Parser for finding and matching UI elements"""

    @staticmethod
    def find_element(
        elements: List[Dict],
        resource_id: Optional[str] = None,
        text: Optional[str] = None,
        description: Optional[str] = None,
        class_name: Optional[str] = None,
        fuzzy_match: bool = True,
        min_similarity: float = 0.6
    ) -> Optional[Dict]:
        """
        Find element matching criteria

        Args:
            elements: List of element dicts
            resource_id: Resource ID to match
            text: Text to match
            description: Content description to match
            class_name: Class name to match
            fuzzy_match: Use fuzzy matching for text/description
            min_similarity: Minimum similarity for fuzzy match (0-1)

        Returns:
            Matching element dict or None
        """
        best_match = None
        best_score = 0.0

        for elem in elements:
            score = 0.0
            matches = 0

            # Match resource ID (exact match only)
            if resource_id:
                if elem.get('resource_id') == resource_id:
                    score += 1.0
                    matches += 1
                else:
                    continue  # Resource ID must match exactly

            # Match class name (exact match only)
            if class_name:
                if elem.get('class') == class_name:
                    score += 0.5
                    matches += 1
                else:
                    continue  # Class must match exactly

            # Match text
            if text:
                elem_text = elem.get('text', '')
                if fuzzy_match:
                    similarity = SequenceMatcher(None, text.lower(), elem_text.lower()).ratio()
                    if similarity >= min_similarity:
                        score += similarity
                        matches += 1
                else:
                    if text.lower() in elem_text.lower() or elem_text.lower() in text.lower():
                        score += 1.0
                        matches += 1

            # Match description
            if description:
                elem_desc = elem.get('content_desc', '')
                if fuzzy_match:
                    similarity = SequenceMatcher(None, description.lower(), elem_desc.lower()).ratio()
                    if similarity >= min_similarity:
                        score += similarity
                        matches += 1
                else:
                    if description.lower() in elem_desc.lower() or elem_desc.lower() in description.lower():
                        score += 1.0
                        matches += 1

            # Only consider elements that match at least one criterion
            if matches > 0:
                normalized_score = score / matches if matches > 0 else 0
                if normalized_score > best_score:
                    best_score = normalized_score
                    best_match = elem

        return best_match if best_score >= min_similarity else None

    @staticmethod
    def find_elements(
        elements: List[Dict],
        resource_id: Optional[str] = None,
        text: Optional[str] = None,
        description: Optional[str] = None,
        class_name: Optional[str] = None,
        fuzzy_match: bool = True,
        min_similarity: float = 0.6
    ) -> List[Dict]:
        """
        Find all elements matching criteria

        Args:
            elements: List of element dicts
            resource_id: Resource ID to match
            text: Text to match
            description: Content description to match
            class_name: Class name to match
            fuzzy_match: Use fuzzy matching for text/description
            min_similarity: Minimum similarity for fuzzy match (0-1)

        Returns:
            List of matching element dicts
        """
        matches = []

        for elem in elements:
            score = 0.0
            matches_count = 0

            # Match resource ID (exact match only)
            if resource_id:
                if elem.get('resource_id') == resource_id:
                    score += 1.0
                    matches_count += 1
                else:
                    continue  # Resource ID must match exactly

            # Match class name (exact match only)
            if class_name:
                if elem.get('class') == class_name:
                    score += 0.5
                    matches_count += 1
                else:
                    continue  # Class must match exactly

            # Match text
            if text:
                elem_text = elem.get('text', '')
                if fuzzy_match:
                    similarity = SequenceMatcher(None, text.lower(), elem_text.lower()).ratio()
                    if similarity >= min_similarity:
                        score += similarity
                        matches_count += 1
                else:
                    if text.lower() in elem_text.lower() or elem_text.lower() in text.lower():
                        score += 1.0
                        matches_count += 1

            # Match description
            if description:
                elem_desc = elem.get('content_desc', '')
                if fuzzy_match:
                    similarity = SequenceMatcher(None, description.lower(), elem_desc.lower()).ratio()
                    if similarity >= min_similarity:
                        score += similarity
                        matches_count += 1
                else:
                    if description.lower() in elem_desc.lower() or elem_desc.lower() in description.lower():
                        score += 1.0
                        matches_count += 1

            # Only consider elements that match at least one criterion
            if matches_count > 0:
                normalized_score = score / matches_count if matches_count > 0 else 0
                if normalized_score >= min_similarity:
                    elem['_match_score'] = normalized_score
                    matches.append(elem)

        # Sort by match score (highest first)
        matches.sort(key=lambda x: x.get('_match_score', 0), reverse=True)
        return matches

    @staticmethod
    def get_clickable_elements(elements: List[Dict]) -> List[Dict]:
        """Filter to only clickable elements"""
        return [e for e in elements if e.get('clickable', False)]

    @staticmethod
    def get_visible_elements(elements: List[Dict]) -> List[Dict]:
        """Filter to only visible/enabled elements"""
        return [e for e in elements if e.get('enabled', True) and e.get('center_x') is not None]

    @staticmethod
    def get_element_center(element: Dict) -> Optional[tuple]:
        """
        Get center coordinates of element

        Args:
            element: Element dict

        Returns:
            Tuple of (x, y) or None
        """
        center_x = element.get('center_x')
        center_y = element.get('center_y')

        if center_x is not None and center_y is not None:
            return (center_x, center_y)

        # Fallback: calculate from bounds
        x1 = element.get('x1')
        y1 = element.get('y1')
        x2 = element.get('x2')
        y2 = element.get('y2')

        if all(v is not None for v in [x1, y1, x2, y2]):
            return ((x1 + x2) // 2, (y1 + y2) // 2)

        return None

    @staticmethod
    def format_element_info(element: Dict) -> str:
        """
        Format element info as readable string

        Args:
            element: Element dict

        Returns:
            Formatted string
        """
        parts = []

        if element.get('class'):
            parts.append(f"class={element['class']}")
        if element.get('resource_id'):
            parts.append(f"id={element['resource_id']}")
        if element.get('text'):
            parts.append(f"text='{element['text']}'")
        if element.get('content_desc'):
            parts.append(f"desc='{element['content_desc']}'")
        if element.get('bounds'):
            parts.append(f"bounds={element['bounds']}")

        return ", ".join(parts)

