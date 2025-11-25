from setuptools import setup, find_packages

setup(
    name="python-agent",
    version="1.0.0",
    description="Python Agent với OpenAI Agents SDK để điều khiển Android devices",
    author="AutoAI Phone",
    packages=find_packages(),
    install_requires=[
        "openai-agents>=0.4.0",
        "openai>=1.54.0",
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.32.0",
        "websockets>=14.0",
        "pydantic>=2.9.0",
        "pyyaml>=6.0.2",
        "pillow>=11.0.0",
        "lxml>=5.3.0",
        "python-multipart>=0.0.12",
        "aiofiles>=24.1.0",
    ],
    python_requires=">=3.9",
)

