"""Screenshot handling utilities"""
import base64
from io import BytesIO
from typing import Optional
from PIL import Image
import logging

logger = logging.getLogger(__name__)


def bytes_to_base64(image_bytes: bytes) -> str:
    """
    Convert image bytes to base64 data URL

    Args:
        image_bytes: Image bytes (PNG format)

    Returns:
        Base64 data URL string
    """
    try:
        base64_str = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/png;base64,{base64_str}"
    except Exception as e:
        logger.error(f"Error converting image to base64: {e}")
        return ""


def base64_to_bytes(base64_str: str) -> Optional[bytes]:
    """
    Convert base64 data URL to image bytes

    Args:
        base64_str: Base64 data URL or base64 string

    Returns:
        Image bytes or None
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        return base64.b64decode(base64_str)
    except Exception as e:
        logger.error(f"Error converting base64 to bytes: {e}")
        return None


def resize_image(image_bytes: bytes, max_width: int = 1920, max_height: int = 1080) -> bytes:
    """
    Resize image if it's too large

    Args:
        image_bytes: Image bytes
        max_width: Maximum width
        max_height: Maximum height

    Returns:
        Resized image bytes
    """
    try:
        img = Image.open(BytesIO(image_bytes))
        width, height = img.size

        if width <= max_width and height <= max_height:
            return image_bytes

        # Calculate new size maintaining aspect ratio
        ratio = min(max_width / width, max_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)

        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Convert back to bytes
        output = BytesIO()
        img_resized.save(output, format='PNG')
        return output.getvalue()
    except Exception as e:
        logger.error(f"Error resizing image: {e}")
        return image_bytes

