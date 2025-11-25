#!/usr/bin/env python3
"""Test script to verify installation"""
import sys

def test_imports():
    """Test all imports"""
    errors = []

    print("Testing imports...")

    # Test basic Python modules
    try:
        import yaml
        print("✓ yaml")
    except ImportError as e:
        errors.append(f"yaml: {e}")
        print(f"✗ yaml: {e}")

    try:
        from openai import OpenAI
        print("✓ openai")
    except ImportError as e:
        errors.append(f"openai: {e}")
        print(f"✗ openai: {e}")

    try:
        from agents import Agent, Runner, Session
        print("✓ openai-agents")
    except ImportError as e:
        errors.append(f"openai-agents: {e}")
        print(f"✗ openai-agents: {e}")

    try:
        import fastapi
        print("✓ fastapi")
    except ImportError as e:
        errors.append(f"fastapi: {e}")
        print(f"✗ fastapi: {e}")

    try:
        import uvicorn
        print("✓ uvicorn")
    except ImportError as e:
        errors.append(f"uvicorn: {e}")
        print(f"✗ uvicorn: {e}")

    try:
        import websockets
        print("✓ websockets")
    except ImportError as e:
        errors.append(f"websockets: {e}")
        print(f"✗ websockets: {e}")

    # Test agent modules
    try:
        from agent.adb import ADBClient, ADBInstaller, UIAutomator
        print("✓ agent.adb")
    except ImportError as e:
        errors.append(f"agent.adb: {e}")
        print(f"✗ agent.adb: {e}")

    try:
        from agent.tools import create_device_tools, create_screen_tools, create_interaction_tools, create_app_tools
        print("✓ agent.tools")
    except ImportError as e:
        errors.append(f"agent.tools: {e}")
        print(f"✗ agent.tools: {e}")

    try:
        from agent.server import HTTPServer, WebSocketServer
        print("✓ agent.server")
    except ImportError as e:
        errors.append(f"agent.server: {e}")
        print(f"✗ agent.server: {e}")

    try:
        from agent.agent import MobileAgent
        print("✓ agent.agent")
    except ImportError as e:
        errors.append(f"agent.agent: {e}")
        print(f"✗ agent.agent: {e}")

    try:
        from agent.utils import ElementParser
        print("✓ agent.utils")
    except ImportError as e:
        errors.append(f"agent.utils: {e}")
        print(f"✗ agent.utils: {e}")

    return errors

def test_config():
    """Test config loading"""
    print("\nTesting config...")
    try:
        import yaml
        from pathlib import Path

        config_path = Path(__file__).parent / "config" / "config.yaml"
        if config_path.exists():
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
            print("✓ Config file loaded")
            return True
        else:
            print("⚠ Config file not found (will use defaults)")
            return True
    except Exception as e:
        print(f"✗ Config error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Python Agent - Installation Test")
    print("=" * 50)

    errors = test_imports()
    test_config()

    print("\n" + "=" * 50)
    if errors:
        print(f"✗ Found {len(errors)} error(s)")
        sys.exit(1)
    else:
        print("✓ All tests passed!")
        print("=" * 50)
        print("\nInstallation successful! You can now run:")
        print("  python main.py")
        print("  or")
        print("  ./start.sh (Mac/Linux)")
        print("  start.bat (Windows)")
        sys.exit(0)

