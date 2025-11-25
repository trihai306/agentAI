"""Main entry point for Python Agent"""
import asyncio
import logging
import sys
import yaml
from pathlib import Path

from agent.adb.adb_client import ADBClient
from agent.adb.uiautomator import UIAutomator
from agent.server.http_server import HTTPServer
from agent.server.websocket_server import WebSocketServer


def setup_logging(config: dict):
    """Setup logging configuration"""
    log_level = config.get("logging", {}).get("level", "INFO")
    log_format = config.get("logging", {}).get("format", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    log_file = config.get("logging", {}).get("file")

    handlers = [logging.StreamHandler(sys.stdout)]
    if log_file:
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=handlers,
    )


def load_config() -> dict:
    """Load configuration from config.yaml"""
    config_path = Path(__file__).parent / "config" / "config.yaml"
    if not config_path.exists():
        # Return default config
        return {
            "server": {
                "http_port": 3001,
                "websocket_port": 3002,
                "host": "127.0.0.1",
            },
            "adb": {
                "path": None,
                "auto_install": True,
                "install_dir": None,
                "add_to_path": True,
            },
            "logging": {
                "level": "INFO",
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "file": None,
            },
        }

    with open(config_path, "r") as f:
        return yaml.safe_load(f)


async def main():
    """Main function"""
    # Load configuration
    config = load_config()

    # Setup logging
    setup_logging(config)
    logger = logging.getLogger(__name__)

    logger.info("Starting Python Agent...")

    # Initialize ADB client with auto-install support
    adb_config = config.get("adb", {})
    adb_path = adb_config.get("path")
    auto_install = adb_config.get("auto_install", True)
    install_dir = adb_config.get("install_dir")

    try:
        adb_client = ADBClient(
            adb_path=adb_path,
            auto_install=auto_install,
            install_dir=install_dir,
        )
        logger.info("ADB client initialized")
    except Exception as e:
        logger.error(f"Failed to initialize ADB client: {e}")
        sys.exit(1)

    # Initialize UI Automator
    ui_automator = UIAutomator(adb_client)
    logger.info("UI Automator initialized")

    # Get server config
    server_config = config.get("server", {})
    http_host = server_config.get("host", "127.0.0.1")
    http_port = server_config.get("http_port", 3001)
    ws_host = server_config.get("host", "127.0.0.1")
    ws_port = server_config.get("websocket_port", 3002)

    # Initialize WebSocket server with ADB client for screen streaming
    ws_server = WebSocketServer(host=ws_host, port=ws_port, adb_client=adb_client)

    # Initialize HTTP server
    http_server = HTTPServer(
        adb_client=adb_client,
        ui_automator=ui_automator,
        ws_server=ws_server,
        host=http_host,
        port=http_port,
    )

    logger.info(f"Starting servers...")
    logger.info(f"HTTP server: http://{http_host}:{http_port}")
    logger.info(f"WebSocket server: ws://{ws_host}:{ws_port}")

    # Start both servers concurrently
    await asyncio.gather(
        ws_server.start(),
        http_server.start(),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0)
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(1)

