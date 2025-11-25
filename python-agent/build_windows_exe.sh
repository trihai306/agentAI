#!/bin/bash
# AutoAIphone Agent - Build Windows EXE từ macOS/Linux
# Sử dụng GitHub Actions để build .exe (không lộ source code)
# Build vào thư mục riêng: dist-windows-exe/

set -e

echo "========================================"
echo "AutoAIphone Agent - Windows EXE Build"
echo "========================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "[ERROR] Git not found! Please install Git to use GitHub Actions build"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "[ERROR] Not a git repository! Please initialize git first"
    exit 1
fi

# Get repository info
REPO_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REPO_REMOTE" ]; then
    echo "[ERROR] No git remote found! Please add a remote repository"
    echo ""
    echo "To add remote:"
    echo "  git remote add origin <your-github-repo-url>"
    exit 1
fi

# Extract repo owner/name from URL
REPO_PATH=$(echo "$REPO_REMOTE" | sed -E 's|.*github.com[:/]([^/]+/[^/]+)(\.git)?$|\1|')
if [ -z "$REPO_PATH" ] || [ "$REPO_PATH" = "$REPO_REMOTE" ]; then
    # Try alternative format
    REPO_PATH=$(echo "$REPO_REMOTE" | sed -E 's|.*github.com/([^/]+/[^/]+)(\.git)?$|\1|')
fi

echo "[INFO] Repository: $REPO_REMOTE"
if [ -n "$REPO_PATH" ] && [ "$REPO_PATH" != "$REPO_REMOTE" ]; then
    echo "[INFO] Repo path: $REPO_PATH"
fi
echo ""

# Check if GitHub Actions workflow exists
if [ ! -f "../.github/workflows/build-windows.yml" ] && [ ! -f ".github/workflows/build-windows.yml" ]; then
    echo "[ERROR] GitHub Actions workflow not found!"
    echo "[ERROR] Expected: .github/workflows/build-windows.yml"
    echo ""
    echo "Please ensure the workflow file exists in the repository"
    exit 1
fi

echo "[INFO] GitHub Actions workflow found"
echo ""

# Ask user if they want to trigger build
echo "========================================"
echo "Build Windows EXE via GitHub Actions"
echo "========================================"
echo ""
echo "This will:"
echo "  1. Commit and push code to trigger GitHub Actions"
echo "  2. Build .exe file on Windows runner (source code hidden)"
echo "  3. Download the .exe from GitHub Actions artifacts"
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Build cancelled"
    exit 0
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "[INFO] Uncommitted changes detected"
    echo ""
    echo "What would you like to do?"
    echo "  1. Commit changes (recommended)"
    echo "  2. Stash changes"
    echo "  3. Cancel"
    echo ""
    read -p "Choose option (1/2/3): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[1]$ ]]; then
        echo "[INFO] Committing changes..."
        git add .
        git commit -m "Trigger Windows EXE build"
        echo "✅ Changes committed"
    elif [[ $REPLY =~ ^[2]$ ]]; then
        echo "[INFO] Stashing changes..."
        git stash push -m "Stashed for Windows EXE build"
        echo "✅ Changes stashed"
        STASHED=true
    else
        echo "Build cancelled"
        exit 0
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "[INFO] Current branch: $CURRENT_BRANCH"
echo ""

# Push to trigger workflow
echo "[1/4] Pushing to GitHub to trigger build..."
git push origin "$CURRENT_BRANCH"

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to push to GitHub"
    exit 1
fi

echo "✅ Code pushed to GitHub"
echo ""

# Build GitHub Actions URL
if [ -n "$REPO_PATH" ] && [ "$REPO_PATH" != "$REPO_REMOTE" ]; then
    ACTIONS_URL="https://github.com/$REPO_PATH/actions"
else
    ACTIONS_URL="https://github.com/<your-repo>/actions"
fi

# Wait for workflow to start
echo "[2/4] Waiting for GitHub Actions workflow to start..."
sleep 5

# Get workflow run info
echo "[INFO] Checking workflow status..."
echo ""
echo "You can monitor the build at:"
echo "  $ACTIONS_URL"
echo ""

# Instructions for manual download
echo "========================================"
echo "Build Triggered Successfully!"
echo "========================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to GitHub Actions:"
echo "   $ACTIONS_URL"
echo ""
echo "2. Find the 'Build Windows Executable' workflow run"
echo ""
echo "3. Wait for it to complete (usually 5-10 minutes)"
echo ""
echo "4. Download the artifact:"
echo "   - Click on the completed workflow run"
echo "   - Scroll down to 'Artifacts' section"
echo "   - Download 'AutoAIphoneAgent-Windows'"
echo ""
echo "5. Extract the zip file to get:"
echo "   - AutoAIphoneAgent.exe (executable - KHÔNG LỘ SOURCE CODE!)"
echo "   - venv/ (virtual environment)"
echo "   - config/ (configuration files)"
echo "   - launcher.bat (optional launcher)"
echo ""
echo "💡 Tip: Install GitHub CLI (gh) for automatic download:"
echo "   macOS: brew install gh"
echo "   Then: gh auth login"
echo ""

# Option to use GitHub CLI if available
if command -v gh &> /dev/null; then
    echo "[3/4] GitHub CLI detected - attempting to download artifact..."
    echo ""

    # Wait a bit for workflow to start
    echo "[INFO] Waiting 30 seconds for workflow to start..."
    sleep 30

    # Try to get the latest workflow run
    WORKFLOW_RUN=$(gh run list --workflow=build-windows.yml --limit 1 --json databaseId,status --jq '.[0]' 2>/dev/null || echo "")

    if [ -n "$WORKFLOW_RUN" ]; then
        RUN_ID=$(echo "$WORKFLOW_RUN" | jq -r '.databaseId' 2>/dev/null || echo "")
        STATUS=$(echo "$WORKFLOW_RUN" | jq -r '.status' 2>/dev/null || echo "")

        if [ -n "$RUN_ID" ] && [ "$STATUS" != "null" ]; then
            echo "[INFO] Workflow run ID: $RUN_ID"
            echo "[INFO] Status: $STATUS"
            echo ""

            if [ "$STATUS" = "completed" ]; then
                echo "[4/4] Downloading artifact..."
                mkdir -p dist-windows-exe
                cd dist-windows-exe
                gh run download "$RUN_ID" --name AutoAIphoneAgent-Windows
                cd ..

                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✅ Artifact downloaded to: dist-windows-exe/"
                    echo ""
                    echo "📦 Contents:"
                    ls -lh dist-windows-exe/
                    echo ""
                    echo "✅ Windows EXE build completed!"
                    exit 0
                fi
            else
                echo "[INFO] Workflow is still running. Status: $STATUS"
                echo "[INFO] You can download the artifact manually when it completes"
            fi
        fi
    fi

    echo ""
    echo "[INFO] To download artifact later, run:"
    echo "  gh run download <run-id> --name AutoAIphoneAgent-Windows"
    echo ""
else
    echo "[3/4] GitHub CLI not found"
    echo ""
    echo "💡 Tip: Install GitHub CLI for automatic artifact download:"
    echo "   macOS: brew install gh"
    echo "   Then run: gh auth login"
    echo ""
fi

echo "[4/4] Manual download required"
echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo ""
echo "✅ Build triggered successfully!"
echo "📦 Download the .exe from GitHub Actions when build completes"
echo "🔒 Source code is hidden in .exe file"
echo ""

