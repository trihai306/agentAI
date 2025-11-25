"""HTTP server using FastAPI"""
import asyncio
import logging
from typing import Dict, Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
import uvicorn

from ..adb.adb_client import ADBClient
from ..adb.uiautomator import UIAutomator
from ..agent import MobileAgent
from .websocket_server import WebSocketServer

logger = logging.getLogger(__name__)


class SuppressHealthLogMiddleware(BaseHTTPMiddleware):
    """Middleware to suppress access logs for /health endpoint"""

    async def dispatch(self, request: Request, call_next):
        # Store original path for logging suppression
        if request.url.path == "/health":
            # Suppress uvicorn access log by setting a flag
            request.state.suppress_log = True
        else:
            request.state.suppress_log = False

        response = await call_next(request)
        return response


# Request models
class ChatRequest(BaseModel):
    message: str
    max_turns: Optional[int] = None  # Max turns limit (optional, uses config default if not provided)
    device_id: Optional[str] = None
    provider: str = "openai"  # Only OpenAI supported
    model: str = "gpt-4o"
    api_key: str
    session_id: str
    context: Optional[Dict] = None
    workflow_replay: Optional[Dict] = None  # Workflow replay data (tool_calls, workflow_id)


class ClickRequest(BaseModel):
    x: int
    y: int


class SwipeRequest(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    duration: int = 300


class TypeRequest(BaseModel):
    text: str


class KeyRequest(BaseModel):
    key: str


class HTTPServer:
    """HTTP server for API endpoints"""

    def __init__(
        self,
        adb_client: ADBClient,
        ui_automator: UIAutomator,
        ws_server: WebSocketServer,
        host: str = "127.0.0.1",
        port: int = 3001,
    ):
        """
        Initialize HTTP server

        Args:
            adb_client: ADB client instance
            ui_automator: UI Automator instance
            ws_server: WebSocket server instance
            host: Host to bind to
            port: Port to bind to
        """
        self.adb_client = adb_client
        self.ui_automator = ui_automator
        self.ws_server = ws_server
        self.host = host
        self.port = port

        # Create FastAPI app
        self.app = FastAPI(title="Agent Bridge API")

        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Suppress health check logs
        self.app.add_middleware(SuppressHealthLogMiddleware)

        # Create agent (will be initialized per request)
        self.agent: Optional[MobileAgent] = None

        # Setup routes
        self._setup_routes()

    async def _handle_tool_completed(
        self,
        tool: str,
        success: bool,
        result: any,
        tool_call: Dict,
        session_id: Optional[str] = None,
    ):
        """
        Handle tool completed event - send tool completed and also screenshot event if applicable
        """
        # Send tool completed event
        await self.ws_server.send_tool_completed(
            tool,
            success,
            result,
            tool_call,
            session_id,
        )

        # If tool is mobile_take_screenshot and result has file_id or image_url, also send screenshot event
        if tool == "mobile_take_screenshot" and success and result:
            try:
                # Extract file_id/image_url and device_id from result
                # Result can be ToolOutputImage object (from SDK) or dict (for backward compatibility)
                file_id = None
                image_url = None
                device_id = None

                # Use attributes directly from SDK object
                if hasattr(result, 'file_id'):
                    file_id = result.file_id
                if hasattr(result, 'image_url'):
                    image_url = result.image_url
                # Backward compatibility: dict format
                if isinstance(result, dict):
                    file_id = result.get("file_id") or file_id
                    image_url = result.get("image_url") or result.get("screenshot") or image_url

                # Extract device_id from tool_call arguments
                if isinstance(tool_call, dict) and "function" in tool_call:
                    func = tool_call["function"]
                    if isinstance(func, dict):
                        arguments = func.get("arguments", {})
                        # Parse arguments if string
                        if isinstance(arguments, str):
                            import json
                            try:
                                arguments = json.loads(arguments) or {}
                            except:
                                arguments = {}
                        # Get device_id from parsed arguments
                        if isinstance(arguments, dict):
                            device_id = arguments.get("device")

                # Send screenshot event if we have file_id or image_url
                # Note: When file_id is present, we don't include image_url in ToolOutputImage
                # to avoid GPT-5 validation errors. image_url is only sent to frontend via WebSocket.
                if file_id or image_url:
                    logger.info(f"📸 Sending screenshot event: file_id={file_id}, has_image_url={bool(image_url)}, device={device_id}")
                    # Send screenshot event
                    # If only file_id is present (no image_url), frontend can fetch image from file_id if needed
                    await self.ws_server.send_screenshot(
                        device_id=device_id or "unknown",
                        screenshot=image_url,  # Base64 data URL if available (None if only file_id)
                        file_id=file_id,  # OpenAI file_id if available
                        format="file_id" if file_id else "base64",
                        session_id=session_id,
                    )
            except Exception as e:
                logger.warning(f"Error sending screenshot event: {e}", exc_info=True)

    def _setup_routes(self):
        """Setup API routes"""

        @self.app.get("/health")
        async def health():
            """Health check endpoint"""
            return {"status": "ok"}

        @self.app.get("/api/devices")
        async def get_devices():
            """Get list of devices"""
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

                return {
                    "success": True,
                    "devices": formatted_devices,
                }
            except Exception as e:
                logger.error(f"Error getting devices: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/devices/{device_id}/screen")
        async def get_screen(device_id: str):
            """Get screenshot"""
            try:
                screenshot_bytes = self.adb_client.screencap(device_id)
                if not screenshot_bytes:
                    raise HTTPException(status_code=500, detail="Failed to capture screenshot")

                from fastapi.responses import Response
                return Response(content=screenshot_bytes, media_type="image/png")
            except Exception as e:
                logger.error(f"Error getting screenshot: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/devices/{device_id}/click")
        async def click(device_id: str, request: ClickRequest):
            """Click at coordinates (legacy)"""
            try:
                success = self.adb_client.input_tap(device_id, request.x, request.y)
                return {"success": success}
            except Exception as e:
                logger.error(f"Error clicking: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/devices/{device_id}/swipe")
        async def swipe(device_id: str, request: SwipeRequest):
            """Swipe (legacy)"""
            try:
                success = self.adb_client.input_swipe(
                    device_id,
                    request.x1,
                    request.y1,
                    request.x2,
                    request.y2,
                    request.duration,
                )
                return {"success": success}
            except Exception as e:
                logger.error(f"Error swiping: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/devices/{device_id}/type")
        async def type_text(device_id: str, request: TypeRequest):
            """Type text (legacy)"""
            try:
                success = self.adb_client.input_text(device_id, request.text)
                return {"success": success}
            except Exception as e:
                logger.error(f"Error typing: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/devices/{device_id}/key")
        async def press_key(device_id: str, request: KeyRequest):
            """Press key (legacy)"""
            try:
                success = self.adb_client.input_key(device_id, request.key)
                return {"success": success}
            except Exception as e:
                logger.error(f"Error pressing key: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/ai/chat")
        async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
            """Chat endpoint"""
            try:
                # Validate API key
                if not request.api_key or not request.api_key.strip():
                    logger.error("API key is missing or empty")
                    raise HTTPException(status_code=400, detail="API key is required")

                # Log request (without exposing full API key) - only at debug level
                api_key_preview = f"{request.api_key[:8]}..." if len(request.api_key) > 8 else "***"
                logger.debug(f"Chat request: provider={request.provider}, model={request.model}, api_key={api_key_preview}")
                # Create agent instance for this request
                agent_instance = MobileAgent(
                    adb_client=self.adb_client,
                    ui_automator=self.ui_automator,
                    on_tool_started=lambda data: asyncio.create_task(
                        self.ws_server.send_tool_started(
                            data["tool"],
                            data.get("tool_call", {}),
                            data.get("arguments", {}),
                            request.session_id,
                        )
                    ),
                    on_tool_completed=lambda data: asyncio.create_task(
                        self._handle_tool_completed(
                            data["tool"],
                            data.get("success", False),
                            data.get("result"),
                            data.get("tool_call", {}),
                            request.session_id,
                        )
                    ),
                    on_response_update=lambda data: asyncio.create_task(
                        self.ws_server.send_response_update(
                            content=data.get("content"),
                            delta=data.get("delta"),
                            tool_calls=data.get("tool_calls"),
                            has_tool_calls=data.get("has_tool_calls", False),
                            is_thinking=data.get("isThinking", False) or data.get("is_thinking", False),
                            new_items=data.get("new_items"),  # Add new_items
                            session_id=request.session_id,
                        )
                    ),
                    on_status_update=lambda data: asyncio.create_task(
                        self.ws_server.send_status_update(
                            status=data.get("status", "unknown"),
                            message=data.get("message", ""),
                            tool=data.get("tool"),
                            success=data.get("success"),
                            iteration=data.get("iteration"),
                            tool_calls_count=data.get("tool_calls_count"),
                            current_turn=data.get("current_turn"),
                            max_turns=data.get("max_turns"),
                            session_id=request.session_id,
                        )
                    ),
                    on_thinking=lambda data: asyncio.create_task(
                        self.ws_server.send_thinking(
                            tool_name=data.get("tool_name", ""),
                            tool_call_id=data.get("tool_call_id", ""),
                            thinking=data.get("thinking", ""),
                            analysis=data.get("analysis", ""),
                            reasoning=data.get("reasoning", ""),
                            next_steps=data.get("next_steps", []),
                            session_id=request.session_id,
                        )
                    ),
                    on_analysis=lambda data: asyncio.create_task(
                        self.ws_server.send_analysis(
                            tool_name=data.get("tool_name", ""),
                            tool_call_id=data.get("tool_call_id", ""),
                            thinking=data.get("thinking", ""),
                            analysis=data.get("analysis", ""),
                            reasoning=data.get("reasoning", ""),
                            next_steps=data.get("next_steps", []),
                            session_id=request.session_id,
                        )
                    ),
                    on_plan_update=lambda data: asyncio.create_task(
                        self.ws_server.send_plan_update(
                            plan=data.get("plan"),
                            next_action=data.get("next_action"),
                            is_complete=data.get("is_complete", False),
                            summary=data.get("summary"),
                            progress=data.get("progress"),
                            session_id=request.session_id,
                        )
                    ),
                    on_workflow_update=lambda data: asyncio.create_task(
                        self.ws_server.send_workflow_update(
                            workflow=data,
                            session_id=request.session_id,
                        )
                    ),
                )

                # Process chat
                # If max_turns is None or not provided, use unlimited (9999)
                # SDK doesn't support None, so we use a very large number
                effective_max_turns = request.max_turns if request.max_turns is not None and request.max_turns > 0 else 9999
                logger.info(f"Chat request max_turns: {request.max_turns}, effective: {effective_max_turns} {'(unlimited)' if effective_max_turns >= 9999 else ''}")
                
                # Handle workflow replay if provided
                if request.workflow_replay and request.workflow_replay.get("tool_calls"):
                    logger.info(f"🔄 Replaying workflow: {len(request.workflow_replay.get('tool_calls', []))} tool calls")
                
                result = await agent_instance.chat(
                    message=request.message,
                    session_id=request.session_id,
                    provider=request.provider,
                    model=request.model,
                    api_key=request.api_key,
                    max_turns=effective_max_turns,
                    workflow_replay=request.workflow_replay,  # Pass workflow replay data
                )

                # Send completion event
                await self.ws_server.send_chat_completed(
                    has_tool_calls=bool(result.get("tool_calls")),
                    session_id=request.session_id,
                )

                return {
                    "success": result.get("success", False),
                    "final_output": result.get("final_output", result.get("content", "")),
                    "content": result.get("content", ""),  # Backward compatibility
                    "new_items": result.get("new_items", []),
                    "last_agent": result.get("last_agent"),
                    "tool_calls": result.get("tool_calls"),  # Backward compatibility
                    "session_id": request.session_id,
                }
            except Exception as e:
                import traceback
                error_traceback = traceback.format_exc()
                error_line = traceback.extract_tb(e.__traceback__)[-1].lineno if e.__traceback__ else 'unknown'
                logger.error(f"Error in chat at line {error_line}: {type(e).__name__}: {e}\n{error_traceback}", exc_info=True)
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/ai/chat/stop")
        async def stop_chat(request: Dict):
            """Stop chat"""
            try:
                # TODO: Implement stop functionality
                # For now, just return success
                return {"success": True}
            except Exception as e:
                logger.error(f"Error stopping chat: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/mobile/tools")
        async def get_mobile_tools():
            """Get list of available mobile tools"""
            try:
                # List of all available mobile tools
                tools = [
                    {
                        "name": "mobile_list_available_devices",
                        "description": "List all available Android devices connected via ADB",
                        "category": "device"
                    },
                    {
                        "name": "mobile_get_screen_size",
                        "description": "Get the screen size of the mobile device in pixels",
                        "category": "device"
                    },
                    {
                        "name": "mobile_set_orientation",
                        "description": "Change the screen orientation of the device (portrait or landscape)",
                        "category": "device"
                    },
                    {
                        "name": "mobile_get_orientation",
                        "description": "Get the current screen orientation of the device",
                        "category": "device"
                    },
                    {
                        "name": "mobile_take_screenshot",
                        "description": "Take a screenshot of the mobile device. Uploads to OpenAI Files API and returns file_id to save tokens.",
                        "category": "screen"
                    },
                    {
                        "name": "mobile_list_elements_on_screen",
                        "description": "List all UI elements on screen with their properties (text, resource-id, bounds, etc.). Use this to find elements before interacting with them.",
                        "category": "screen"
                    },
                    {
                        "name": "mobile_click_element",
                        "description": "Click on an element on the screen. Finds element by resource-id, text, or description. Always use this instead of coordinates.",
                        "category": "interaction"
                    },
                    {
                        "name": "mobile_swipe_element",
                        "description": "Swipe on the screen. Can swipe from one element to another, or swipe in a direction (up/down/left/right) from an element.",
                        "category": "interaction"
                    },
                    {
                        "name": "mobile_double_tap_element",
                        "description": "Double-tap on an element on the screen.",
                        "category": "interaction"
                    },
                    {
                        "name": "mobile_long_press_element",
                        "description": "Long press on an element on the screen.",
                        "category": "interaction"
                    },
                    {
                        "name": "mobile_type_keys",
                        "description": "Type text into the focused element.",
                        "category": "interaction"
                    },
                    {
                        "name": "mobile_press_button",
                        "description": "Press a button on device: BACK, HOME, VOLUME_UP, VOLUME_DOWN, ENTER, etc.",
                        "category": "interaction"
                    },
                    {
                        "name": "mobile_launch_app",
                        "description": "Launch an app on mobile device by package name",
                        "category": "app"
                    },
                    {
                        "name": "mobile_open_url",
                        "description": "Open a URL in browser on device",
                        "category": "app"
                    },
                    {
                        "name": "mobile_list_apps",
                        "description": "List all the installed apps on the device",
                        "category": "app"
                    },
                ]

                return {"tools": tools}
            except Exception as e:
                logger.error(f"Error getting mobile tools: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/models/{provider}")
        async def get_models(provider: str, main: bool = False):
            """Get available models for provider (only OpenAI supported)"""
            # Only support OpenAI
            if provider != "openai":
                return {"models": []}

            # OpenAI models list
            models = [
                {"value": "gpt-5", "label": "GPT-5 (Mới nhất - Khuyến nghị)", "shortLabel": "GPT-5"},
                {"value": "gpt-5-mini", "label": "GPT-5 Mini (Nhanh, Rẻ)", "shortLabel": "GPT-5 Mini"},
                {"value": "gpt-4o", "label": "GPT-4o (Ổn định)", "shortLabel": "GPT-4o"},
                {"value": "gpt-4o-mini", "label": "GPT-4o Mini (Ổn định)", "shortLabel": "GPT-4o Mini"},
                {"value": "gpt-4-turbo", "label": "GPT-4 Turbo", "shortLabel": "GPT-4 Turbo"},
                {"value": "gpt-3.5-turbo", "label": "GPT-3.5 Turbo (Rẻ)", "shortLabel": "GPT-3.5 Turbo"},
                {"value": "o1-preview", "label": "O1 Preview (Reasoning)", "shortLabel": "O1 Preview"},
                {"value": "o1-mini", "label": "O1 Mini (Reasoning, Rẻ)", "shortLabel": "O1 Mini"},
                {"value": "o3-mini", "label": "O3 Mini (Reasoning mới nhất)", "shortLabel": "O3 Mini"},
            ]

            if main:
                # Return only main/recommended models
                models = [m for m in models if "Khuyến nghị" in m.get("label", "") or "Mới nhất" in m.get("label", "")]

            return {"models": models}

    async def start(self):
        """Start HTTP server"""
        # Custom access log filter to suppress /health logs
        class HealthCheckFilter(logging.Filter):
            def filter(self, record):
                # Suppress access logs for /health endpoint
                if hasattr(record, 'scope') and record.scope.get('path') == '/health':
                    return False
                # Also check message content
                if hasattr(record, 'getMessage'):
                    msg = record.getMessage()
                    if '/health' in msg and 'GET' in msg:
                        return False
                return True

        # Get uvicorn access logger and add filter
        access_logger = logging.getLogger("uvicorn.access")
        access_logger.addFilter(HealthCheckFilter())

        config = uvicorn.Config(
            self.app,
            host=self.host,
            port=self.port,
            log_level="info",
        )
        server = uvicorn.Server(config)
        await server.serve()

    def run(self):
        """Run HTTP server (blocking)"""
        # Custom access log filter to suppress /health logs
        class HealthCheckFilter(logging.Filter):
            def filter(self, record):
                # Suppress access logs for /health endpoint
                if hasattr(record, 'scope') and record.scope.get('path') == '/health':
                    return False
                # Also check message content
                if hasattr(record, 'getMessage'):
                    msg = record.getMessage()
                    if '/health' in msg and 'GET' in msg:
                        return False
                return True

        # Get uvicorn access logger and add filter
        access_logger = logging.getLogger("uvicorn.access")
        access_logger.addFilter(HealthCheckFilter())

        uvicorn.run(
            self.app,
            host=self.host,
            port=self.port,
            log_level="info",
        )

