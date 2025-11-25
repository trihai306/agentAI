# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for macOS GUI version

block_cipher = None

a = Analysis(
    ['gui.py', 'installer.py', 'main.py'],  # Include all main files
    pathex=[],
    binaries=[],
    datas=[
        ('config', 'config'),
        ('agent', 'agent'),  # Include entire agent package
    ],
    hiddenimports=[
        'tkinter',
        'tkinter.ttk',
        '_tkinter',
        'webbrowser',
        'threading',
        'subprocess',
        'pathlib',
        'installer',
        'installer.AgentInstaller',
        # Include main and agent modules
        'main',
        'agent',
        'agent.adb',
        'agent.adb.adb_client',
        'agent.adb.adb_installer',
        'agent.server',
        'agent.server.http_server',
        'agent.server.websocket_server',
        'agent.ui_automator',
        'asyncio',
        'yaml',
        'fastapi',
        'uvicorn',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AutoAIphoneAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
