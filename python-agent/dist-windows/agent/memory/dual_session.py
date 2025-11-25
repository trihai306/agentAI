"""
Dual Session: Lưu conversation history vào cả SQLite và Laravel Backend
Theo Session protocol của OpenAI Agents SDK
"""
import logging
import json
from typing import List, Optional
import httpx

try:
    from agents.memory.session import SessionABC
    from agents.items import TResponseInputItem
except ImportError:
    try:
        from openai.agents.memory.session import SessionABC
        from openai.agents.items import TResponseInputItem
    except ImportError:
        raise ImportError("agents.memory.session not found. Please install openai-agents package.")

try:
    from agents import SQLiteSession
except ImportError:
    try:
        from openai.agents import SQLiteSession
    except ImportError:
        raise ImportError("SQLiteSession not found. Please install openai-agents package.")

logger = logging.getLogger(__name__)


class DualSession(SessionABC):
    """
    Session implementation lưu vào cả SQLite và Laravel Backend
    Theo Session protocol: https://openai.github.io/openai-agents-python/sessions/
    """

    def __init__(
        self,
        session_id: str,
        sqlite_db_path: str,
        backend_url: str = "http://127.0.0.1:8000",
        backend_api_key: Optional[str] = None,
    ):
        """
        Initialize dual session

        Args:
            session_id: Session ID từ frontend
            sqlite_db_path: Path to SQLite database file
            backend_url: Laravel backend URL
            backend_api_key: Optional API key for backend authentication
        """
        self.session_id = session_id
        self.backend_url = backend_url.rstrip('/')
        self.backend_api_key = backend_api_key

        # Create SQLite session (primary storage for Agent SDK)
        self.sqlite_session = SQLiteSession(session_id, sqlite_db_path)

        logger.info(f"DualSession initialized: session_id={session_id}, backend={backend_url}")

    async def get_items(self, limit: Optional[int] = None) -> List[TResponseInputItem]:
        """
        Retrieve conversation history from SQLite (Agent SDK reads from here)
        Also sync from backend if needed
        """
        try:
            # Get from SQLite (primary)
            items = await self.sqlite_session.get_items(limit=limit)

            # Optionally sync from backend if SQLite is empty
            if not items:
                await self._sync_from_backend()
                items = await self.sqlite_session.get_items(limit=limit)

            return items
        except Exception as e:
            logger.error(f"Error getting items from DualSession: {e}")
            # Fallback to SQLite only
            return await self.sqlite_session.get_items(limit=limit)

    async def add_items(self, items: List[TResponseInputItem]) -> None:
        """
        Add items to both SQLite and Backend
        """
        try:
            # Add to SQLite first (required for Agent SDK)
            await self.sqlite_session.add_items(items)

            # Sync to backend asynchronously (don't block)
            try:
                await self._sync_to_backend(items)
            except Exception as backend_error:
                logger.warning(f"Failed to sync to backend (non-critical): {backend_error}")
        except Exception as e:
            logger.error(f"Error adding items to DualSession: {e}")
            raise

    async def pop_item(self) -> Optional[TResponseInputItem]:
        """
        Remove and return the most recent item from both stores
        """
        try:
            # Pop from SQLite
            item = await self.sqlite_session.pop_item()

            # Also remove from backend
            if item:
                try:
                    await self._remove_last_from_backend()
                except Exception as backend_error:
                    logger.warning(f"Failed to remove from backend (non-critical): {backend_error}")

            return item
        except Exception as e:
            logger.error(f"Error popping item from DualSession: {e}")
            return await self.sqlite_session.pop_item()

    async def clear_session(self) -> None:
        """
        Clear all items from both stores
        """
        try:
            # Clear SQLite
            await self.sqlite_session.clear_session()

            # Clear backend
            try:
                await self._clear_backend()
            except Exception as backend_error:
                logger.warning(f"Failed to clear backend (non-critical): {backend_error}")
        except Exception as e:
            logger.error(f"Error clearing DualSession: {e}")
            raise

    async def _sync_to_backend(self, items: List[TResponseInputItem]) -> None:
        """Sync items to Laravel backend"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {}
                if self.backend_api_key:
                    headers["Authorization"] = f"Bearer {self.backend_api_key}"

                # Convert items to backend format
                messages = []
                for item in items:
                    if isinstance(item, dict):
                        role = item.get("role", "user")
                        content = item.get("content", "")
                        if content:
                            messages.append({
                                "role": role,
                                "content": content,
                                "tool_calls": item.get("tool_calls"),
                                "metadata": item.get("metadata", {}),
                            })

                if messages:
                    response = await client.post(
                        f"{self.backend_url}/api/chat/session/{self.session_id}/messages",
                        json={"messages": messages},
                        headers=headers,
                    )
                    response.raise_for_status()
                    logger.debug(f"Synced {len(messages)} messages to backend")
        except httpx.RequestError as e:
            logger.warning(f"Backend sync failed (network error): {e}")
        except httpx.HTTPStatusError as e:
            logger.warning(f"Backend sync failed (HTTP {e.response.status_code}): {e}")
        except Exception as e:
            logger.warning(f"Backend sync failed: {e}")

    async def _sync_from_backend(self) -> None:
        """Sync items from Laravel backend to SQLite"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {}
                if self.backend_api_key:
                    headers["Authorization"] = f"Bearer {self.backend_api_key}"

                response = await client.get(
                    f"{self.backend_url}/api/chat/session/{self.session_id}/messages",
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()

                # Convert backend messages to Agent SDK format
                items = []
                for msg in data.get("messages", []):
                    item = {
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", ""),
                    }
                    if msg.get("tool_calls"):
                        item["tool_calls"] = msg["tool_calls"]
                    if msg.get("metadata"):
                        item["metadata"] = msg["metadata"]
                    items.append(item)

                if items:
                    await self.sqlite_session.add_items(items)
                    logger.debug(f"Synced {len(items)} messages from backend")
        except httpx.RequestError as e:
            logger.debug(f"Backend sync from failed (network error): {e}")
        except httpx.HTTPStatusError as e:
            logger.debug(f"Backend sync from failed (HTTP {e.response.status_code}): {e}")
        except Exception as e:
            logger.debug(f"Backend sync from failed: {e}")

    async def _remove_last_from_backend(self) -> None:
        """Remove last message from backend"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {}
                if self.backend_api_key:
                    headers["Authorization"] = f"Bearer {self.backend_api_key}"

                await client.delete(
                    f"{self.backend_url}/api/chat/session/{self.session_id}/messages/last",
                    headers=headers,
                )
        except Exception as e:
            logger.debug(f"Backend remove last failed: {e}")

    async def _clear_backend(self) -> None:
        """Clear all messages from backend"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {}
                if self.backend_api_key:
                    headers["Authorization"] = f"Bearer {self.backend_api_key}"

                await client.delete(
                    f"{self.backend_url}/api/chat/session/{self.session_id}/messages",
                    headers=headers,
                )
        except Exception as e:
            logger.debug(f"Backend clear failed: {e}")

