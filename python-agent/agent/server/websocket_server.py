"""WebSocket server for real-time events"""
import asyncio
import json
import logging
import base64
import io
from typing import Dict, Set, Optional, Callable
from websockets.server import serve, WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed
from PIL import Image

logger = logging.getLogger(__name__)


class WebSocketServer:
    """WebSocket server for broadcasting events to frontend"""

    def __init__(self, host: str = "127.0.0.1", port: int = 3002, adb_client=None):
        """
        Initialize WebSocket server

        Args:
            host: Host to bind to
            port: Port to bind to
            adb_client: ADB client instance for screen streaming
        """
        self.host = host
        self.port = port
        self.adb_client = adb_client
        self.clients: Set[WebSocketServerProtocol] = set()
        self.sessions: Dict[str, Set[WebSocketServerProtocol]] = {}  # session_id -> clients
        self.server = None
        self._running = False
        # Screen streaming tasks: device_id -> task
        self.streaming_tasks: Dict[str, asyncio.Task] = {}
        # Streaming clients: device_id -> Set[websocket]
        self.streaming_clients: Dict[str, Set[WebSocketServerProtocol]] = {}

    async def register_client(self, websocket: WebSocketServerProtocol):
        """Register new client"""
        self.clients.add(websocket)
        logger.debug(f"WebSocket client connected. Total clients: {len(self.clients)}")

        # Send connection confirmation
        await self.send_to_client(websocket, {
            "type": "connection:established",
            "message": "Connected to Agent Bridge WebSocket",
        })

        # Send devices list immediately when client connects
        if self.adb_client:
            try:
                devices = self.adb_client.devices()
                formatted_devices = []
                for d in devices:
                    if d["state"] == "device":
                        device_info = {
                            "id": d["id"],
                            "device": d["id"],  # Alias for compatibility
                            "state": d["state"],
                            "status": d["state"],  # Frontend expects "status"
                            "model": d.get("model", "Unknown"),
                            "name": d.get("model", d["id"]),  # Use model as name, fallback to id
                        }
                        formatted_devices.append(device_info)

                await self.send_to_client(websocket, {
                    "type": "devices",
                    "devices": formatted_devices,
                })
                logger.debug(f"Sent {len(formatted_devices)} devices to client")
            except Exception as e:
                logger.error(f"Error sending devices to client: {e}")
                # Send empty list on error
                await self.send_to_client(websocket, {
                    "type": "devices",
                    "devices": [],
                })

    async def unregister_client(self, websocket: WebSocketServerProtocol):
        """Unregister client"""
        self.clients.discard(websocket)

        # Remove from sessions
        for session_id, clients in list(self.sessions.items()):
            clients.discard(websocket)
            if not clients:
                del self.sessions[session_id]

        logger.debug(f"WebSocket client disconnected. Total clients: {len(self.clients)}")

    async def register_session(
        self,
        websocket: WebSocketServerProtocol,
        session_id: Optional[str] = None,
        device_id: Optional[str] = None,
    ):
        """Register client to session"""
        if session_id:
            if session_id not in self.sessions:
                self.sessions[session_id] = set()
            self.sessions[session_id].add(websocket)

            logger.debug(f"Client registered to session: {session_id}")

            # Send confirmation
            await self.send_to_client(websocket, {
                "type": "session:registered",
                "session_id": session_id,
                "device_id": device_id,
                "connected_at": asyncio.get_event_loop().time(),
            })

    async def send_to_client(self, websocket: WebSocketServerProtocol, data: Dict):
        """Send data to specific client"""
        try:
            await websocket.send(json.dumps(data))
        except ConnectionClosed:
            await self.unregister_client(websocket)
        except Exception as e:
            logger.error(f"Error sending to client: {e}")

    async def broadcast(self, data: Dict, session_id: Optional[str] = None):
        """
        Broadcast data to all clients or clients in specific session

        Args:
            data: Data to broadcast
            session_id: Optional session ID to filter clients
        """
        if session_id and session_id in self.sessions:
            # Send to session clients
            clients = self.sessions[session_id].copy()
        else:
            # Send to all clients
            clients = self.clients.copy()

        if not clients:
            return

        message = json.dumps(data)
        disconnected = []

        for client in clients:
            try:
                await client.send(message)
            except ConnectionClosed:
                disconnected.append(client)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(client)

        # Clean up disconnected clients
        for client in disconnected:
            await self.unregister_client(client)

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle WebSocket client connection"""
        await self.register_client(websocket)

        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")

                    if msg_type == "register:session":
                        await self.register_session(
                            websocket,
                            session_id=data.get("session_id"),
                            device_id=data.get("device_id"),
                        )
                    elif msg_type == "startScreenStream":
                        # Start screen streaming for device
                        device_id = data.get("deviceId")
                        use_scrcpy = data.get("useScrcpy", False)
                        if device_id:
                            await self.start_screen_stream(websocket, device_id, use_scrcpy)
                    elif msg_type == "stopScreenStream":
                        # Stop screen streaming for device
                        device_id = data.get("deviceId")
                        if device_id:
                            await self.stop_screen_stream(websocket, device_id)
                    elif msg_type == "refresh_devices" or msg_type == "get_devices":
                        # Client requests device list refresh
                        if self.adb_client:
                            try:
                                devices = self.adb_client.devices()
                                formatted_devices = []
                                for d in devices:
                                    if d["state"] == "device":
                                        device_info = {
                                            "id": d["id"],
                                            "device": d["id"],
                                            "state": d["state"],
                                            "status": d["state"],
                                            "model": d.get("model", "Unknown"),
                                            "name": d.get("model", d["id"]),
                                        }
                                        formatted_devices.append(device_info)

                                await self.send_to_client(websocket, {
                                    "type": "devices",
                                    "devices": formatted_devices,
                                })
                                logger.debug(f"Sent {len(formatted_devices)} devices to client (on request)")
                            except Exception as e:
                                logger.error(f"Error sending devices to client: {e}")
                                await self.send_to_client(websocket, {
                                    "type": "devices",
                                    "devices": [],
                                })
                    else:
                        logger.warning(f"Unknown message type: {msg_type}")
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON message: {message}")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
        except ConnectionClosed:
            pass
        finally:
            # Stop all streams for this client
            await self.cleanup_client_streams(websocket)
            await self.unregister_client(websocket)

    async def start(self):
        """Start WebSocket server"""
        self._running = True
        self.server = await serve(
            self.handle_client,
            self.host,
            self.port,
        )
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")

    async def stop(self):
        """Stop WebSocket server"""
        self._running = False
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        logger.info("WebSocket server stopped")

    # Event broadcasting methods
    async def send_tool_started(
        self,
        tool: str,
        tool_call: Dict,
        arguments: Dict,
        session_id: Optional[str] = None,
    ):
        """Send tool started event"""
        await self.broadcast({
            "type": "ai:tool:started",
            "tool": tool,
            "toolCall": tool_call,
            "arguments": arguments,
        }, session_id)

    async def send_tool_completed(
        self,
        tool: str,
        success: bool,
        result: any,
        tool_call: Dict,
        session_id: Optional[str] = None,
    ):
        """Send tool completed event"""
        # Serialize result for JSON (only convert complex objects, keep basic types as-is)
        serialized_result = result
        if result is not None and not isinstance(result, (dict, str, int, float, bool, type(None))):
            # Convert complex objects to dict or string
            if hasattr(result, '__dict__'):
                serialized_result = result.__dict__
            else:
                try:
                    serialized_result = str(result)
                except:
                    serialized_result = None

        await self.broadcast({
            "type": "ai:tool:completed",
            "tool": tool,
            "success": success,
            "result": serialized_result,
            "toolCall": tool_call,
        }, session_id)

    async def send_response_update(
        self,
        content: Optional[str] = None,
        delta: Optional[str] = None,
        tool_calls: Optional[list] = None,
        has_tool_calls: bool = False,
        is_thinking: bool = False,
        new_items: Optional[list] = None,
        session_id: Optional[str] = None,
    ):
        """Send response update event"""
        await self.broadcast({
            "type": "ai:response:update",
            "content": content,
            "delta": delta,
            "new_items": new_items,  # Add new_items
            "tool_calls": tool_calls,  # Backward compatibility
            "has_tool_calls": has_tool_calls,
            "isThinking": is_thinking,
        }, session_id)

    async def send_status_update(
        self,
        status: str,
        message: str,
        tool: Optional[str] = None,
        success: Optional[bool] = None,
        iteration: Optional[int] = None,
        tool_calls_count: Optional[int] = None,
        current_turn: Optional[int] = None,
        max_turns: Optional[int] = None,
        session_id: Optional[str] = None,
    ):
        """Send status update event"""
        await self.broadcast({
            "type": "ai:status:update",
            "status": status,
            "message": message,
            "tool": tool,
            "success": success,
            "iteration": iteration,
            "tool_calls_count": tool_calls_count,
            "current_turn": current_turn,
            "max_turns": max_turns,
        }, session_id)

    async def send_thinking(
        self,
        tool_name: str,
        tool_call_id: str,
        thinking: str,
        analysis: str,
        reasoning: str,
        next_steps: list,
        session_id: Optional[str] = None,
    ):
        """Send structured thinking event"""
        await self.broadcast({
            "type": "ai:thinking:structured",
            "toolName": tool_name,
            "toolCallId": tool_call_id,
            "thinking": thinking,
            "analysis": analysis,
            "reasoning": reasoning,
            "next_steps": next_steps,
        }, session_id)

    async def send_analysis(
        self,
        tool_name: str,
        tool_call_id: str,
        thinking: str,
        analysis: str,
        reasoning: str,
        next_steps: list,
        session_id: Optional[str] = None,
    ):
        """Send tool analysis event"""
        await self.broadcast({
            "type": "ai:tool:analysis",
            "toolName": tool_name,
            "toolCallId": tool_call_id,
            "thinking": thinking,
            "analysis": analysis,
            "reasoning": reasoning,
            "next_steps": next_steps,
        }, session_id)

    async def send_chat_completed(
        self,
        has_tool_calls: bool = False,
        session_id: Optional[str] = None,
    ):
        """Send chat completed event"""
        await self.broadcast({
            "type": "ai:chat:completed",
            "has_tool_calls": has_tool_calls,
        }, session_id)

    async def send_plan_update(
        self,
        plan: Optional[Dict] = None,
        next_action: Optional[str] = None,
        is_complete: bool = False,
        summary: Optional[str] = None,
        progress: Optional[Dict] = None,
        session_id: Optional[str] = None,
    ):
        """Send plan update event"""
        await self.broadcast({
            "type": "ai:plan:update",
            "plan": plan,
            "nextAction": next_action,
            "isComplete": is_complete,
            "summary": summary,
            "progress": progress,
        }, session_id)

    async def send_workflow_update(
        self,
        workflow: Optional[Dict] = None,
        session_id: Optional[str] = None,
    ):
        """Send workflow update event with element information for saving and replay"""
        if not workflow:
            return
        
        await self.broadcast({
            "type": "ai:workflow:update",
            "workflow": workflow,
            "nodes": workflow.get("nodes", []),
            "edges": workflow.get("edges", []),
            "tool_calls": workflow.get("tool_calls", []),
            "metadata": workflow.get("metadata", {}),
            "name": workflow.get("name", "Workflow"),
            "description": workflow.get("description", ""),
        }, session_id)

    async def send_screenshot(
        self,
        device_id: str,
        screenshot: Optional[str] = None,
        file_id: Optional[str] = None,
        format: str = "base64",
        timestamp: Optional[float] = None,
        session_id: Optional[str] = None,
    ):
        """Send screenshot event"""
        await self.broadcast({
            "type": "mobile:screenshot",
            "deviceId": device_id,
            "screenshot": screenshot,
            "file_id": file_id,
            "format": format,
            "timestamp": timestamp or asyncio.get_event_loop().time(),
        }, session_id)

    async def start_screen_stream(
        self,
        websocket: WebSocketServerProtocol,
        device_id: str,
        use_scrcpy: bool = False,
    ):
        """Start screen streaming for device"""
        if not self.adb_client:
            logger.warning("ADB client not available for screen streaming")
            await self.send_to_client(websocket, {
                "type": "error",
                "message": "ADB client not available",
            })
            return

        # Add client to streaming clients for this device
        if device_id not in self.streaming_clients:
            self.streaming_clients[device_id] = set()
        self.streaming_clients[device_id].add(websocket)

        # Start streaming task if not already running
        if device_id not in self.streaming_tasks:
            logger.info(f"Starting screen stream for device: {device_id}")
            task = asyncio.create_task(self._screen_stream_loop(device_id, use_scrcpy))
            self.streaming_tasks[device_id] = task

            # Send stream started event
            await self.send_to_client(websocket, {
                "type": "screen:streamStarted",
                "deviceId": device_id,
                "method": "screenshot" if not use_scrcpy else "scrcpy",
                "format": "jpeg",  # Optimized JPEG format
                "fps": 60,  # Target 60 FPS for smooth streaming
            })

    async def stop_screen_stream(
        self,
        websocket: WebSocketServerProtocol,
        device_id: str,
    ):
        """Stop screen streaming for device"""
        if device_id in self.streaming_clients:
            self.streaming_clients[device_id].discard(websocket)

            # If no more clients, stop the streaming task
            if not self.streaming_clients[device_id]:
                if device_id in self.streaming_tasks:
                    task = self.streaming_tasks[device_id]
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                    del self.streaming_tasks[device_id]
                del self.streaming_clients[device_id]
                logger.info(f"Stopped screen stream for device: {device_id}")

    async def cleanup_client_streams(self, websocket: WebSocketServerProtocol):
        """Clean up all streams for a client"""
        devices_to_clean = []
        for device_id, clients in self.streaming_clients.items():
            if websocket in clients:
                clients.discard(websocket)
                if not clients:
                    devices_to_clean.append(device_id)

        for device_id in devices_to_clean:
            if device_id in self.streaming_tasks:
                task = self.streaming_tasks[device_id]
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                del self.streaming_tasks[device_id]
            del self.streaming_clients[device_id]

    def _optimize_screenshot(self, screenshot_bytes: bytes, max_width: int = 1280, max_height: int = 720, quality: int = 85) -> bytes:
        """
        Optimize screenshot by resizing and converting to JPEG

        Args:
            screenshot_bytes: Original PNG screenshot bytes
            max_width: Maximum width (default 1280)
            max_height: Maximum height (default 720)
            quality: JPEG quality 1-100 (default 85)

        Returns:
            Optimized JPEG bytes
        """
        try:
            # Load PNG image from bytes
            img = Image.open(io.BytesIO(screenshot_bytes))

            # Get original dimensions
            orig_width, orig_height = img.size

            # Calculate new dimensions maintaining aspect ratio
            if orig_width > max_width or orig_height > max_height:
                ratio = min(max_width / orig_width, max_height / orig_height)
                new_width = int(orig_width * ratio)
                new_height = int(orig_height * ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Convert to RGB if necessary (JPEG doesn't support transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Convert to JPEG with optimization
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()
        except Exception as e:
            logger.error(f"Error optimizing screenshot: {e}")
            # Fallback: return original if optimization fails
            return screenshot_bytes

    async def _screen_stream_loop(self, device_id: str, use_scrcpy: bool = False):
        """Background task to stream screenshots with optimization"""
        target_fps = 60  # Target 60 FPS for smooth streaming
        frame_delay = 1.0 / target_fps  # ~16.67ms per frame
        consecutive_errors = 0
        max_errors = 5

        try:
            while device_id in self.streaming_clients and self.streaming_clients[device_id]:
                start_time = asyncio.get_event_loop().time()

                try:
                    # Capture screenshot in executor to avoid blocking
                    loop = asyncio.get_event_loop()
                    screenshot_bytes = await loop.run_in_executor(
                        None,
                        self.adb_client.screencap,
                        device_id
                    )

                    if screenshot_bytes:
                        # Optimize screenshot (resize + JPEG compression) in executor
                        optimized_bytes = await loop.run_in_executor(
                            None,
                            self._optimize_screenshot,
                            screenshot_bytes
                        )

                        # Convert to base64
                        screenshot_base64 = base64.b64encode(optimized_bytes).decode('utf-8')

                        # Send to all clients streaming this device
                        clients = self.streaming_clients[device_id].copy()
                        send_tasks = []
                        for client in clients:
                            try:
                                send_tasks.append(
                                    self.send_to_client(client, {
                                        "type": "screen:updated",
                                        "deviceId": device_id,
                                        "screenshot": screenshot_base64,
                                        "format": "jpeg",  # Indicate JPEG format
                                    })
                                )
                            except Exception as e:
                                logger.warning(f"Error preparing screenshot send to client: {e}")
                                self.streaming_clients[device_id].discard(client)

                        # Send to all clients concurrently
                        if send_tasks:
                            results = await asyncio.gather(*send_tasks, return_exceptions=True)
                            for i, result in enumerate(results):
                                if isinstance(result, Exception):
                                    logger.warning(f"Error sending screenshot to client: {result}")
                                    if i < len(clients):
                                        self.streaming_clients[device_id].discard(list(clients)[i])

                        consecutive_errors = 0  # Reset error counter on success
                    else:
                        consecutive_errors += 1
                        if consecutive_errors >= max_errors:
                            logger.error(f"Failed to capture screenshot {max_errors} times, stopping stream")
                            break
                except Exception as e:
                    consecutive_errors += 1
                    logger.error(f"Error capturing screenshot: {e}")
                    if consecutive_errors >= max_errors:
                        logger.error(f"Too many consecutive errors ({consecutive_errors}), stopping stream")
                        break
                    # Wait a bit before retrying
                    await asyncio.sleep(0.05)

                # Calculate delay to maintain target FPS
                elapsed = asyncio.get_event_loop().time() - start_time
                sleep_time = max(0, frame_delay - elapsed)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        except asyncio.CancelledError:
            logger.info(f"Screen stream cancelled for device: {device_id}")
        except Exception as e:
            logger.error(f"Error in screen stream loop: {e}")
        finally:
            # Cleanup
            if device_id in self.streaming_tasks:
                del self.streaming_tasks[device_id]
            if device_id in self.streaming_clients:
                del self.streaming_clients[device_id]

