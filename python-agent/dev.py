"""Development server with auto-reload on file changes"""
import asyncio
import logging
import sys
import signal
import subprocess
import threading
from pathlib import Path
from watchfiles import awatch, Change

logger = logging.getLogger(__name__)


class DevServer:
    """Development server with auto-reload"""

    def __init__(self, main_script: str = "main.py"):
        self.main_script = main_script
        self.process: subprocess.Popen = None
        self.running = False
        self.restart_delay = 1.0  # Delay before restart (seconds)
        self.output_thread = None

    def start_server(self):
        """Start the server process"""
        if self.process:
            self.stop_server()

        logger.info("🚀 Starting server...")
        self.process = subprocess.Popen(
            [sys.executable, self.main_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Start thread to stream output
        def stream_output():
            if self.process and self.process.stdout:
                try:
                    for line in iter(self.process.stdout.readline, ''):
                        if not line:
                            break
                        print(line.rstrip())
                except Exception:
                    pass

        self.output_thread = threading.Thread(target=stream_output, daemon=True)
        self.output_thread.start()

    def stop_server(self):
        """Stop the server process"""
        if self.process:
            logger.info("🛑 Stopping server...")
            try:
                # Try graceful shutdown
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Force kill if doesn't stop
                    logger.warning("Server didn't stop gracefully, forcing kill...")
                    self.process.kill()
                    self.process.wait()
            except Exception as e:
                logger.error(f"Error stopping server: {e}")
            finally:
                self.process = None
                self.output_thread = None

    async def watch_and_reload(self):
        """Watch for file changes and reload server"""
        # Watch Python files in agent directory
        watch_paths = [
            str(Path(__file__).parent / "agent"),
            str(Path(__file__).parent / "main.py"),
            str(Path(__file__).parent / "config"),
        ]

        logger.info(f"👀 Watching for changes in: {', '.join(watch_paths)}")
        logger.info("💡 Auto-reload enabled. Server will restart on file changes.")

        # Filter to only watch .py, .yaml, .yml files
        async for changes in awatch(*watch_paths, watch_filter=None):
            # Filter changes to only Python and config files
            relevant_changes = [
                change for change in changes
                if Path(change[1]).suffix in ['.py', '.yaml', '.yml']
            ]

            if not relevant_changes:
                continue

            # Check if any file was modified or added
            should_reload = any(
                change[0] in (Change.modified, Change.added)
                for change in relevant_changes
            )

            if should_reload:
                files_changed = [Path(change[1]).name for change in relevant_changes[:3]]  # Show max 3 files
                if len(relevant_changes) > 3:
                    files_changed.append(f"... and {len(relevant_changes) - 3} more")
                logger.info(f"📝 Files changed: {', '.join(files_changed)}")
                logger.info(f"🔄 Reloading server in {self.restart_delay}s...")

                # Wait a bit to avoid multiple reloads from rapid changes
                await asyncio.sleep(self.restart_delay)

                # Restart server
                self.stop_server()
                await asyncio.sleep(0.5)  # Brief pause before restart
                self.start_server()

    def run(self):
        """Run development server"""
        self.running = True

        # Setup signal handlers
        def signal_handler(sig, frame):
            logger.info("\n🛑 Shutting down...")
            self.stop_server()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        # Start server initially
        self.start_server()

        # Start watching for changes
        try:
            asyncio.run(self.watch_and_reload())
        except KeyboardInterrupt:
            signal_handler(None, None)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    dev_server = DevServer()
    dev_server.run()

