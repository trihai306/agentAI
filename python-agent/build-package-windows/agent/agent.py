"""OpenAI Agents SDK agent with mobile tools"""
import json
import logging
from typing import Dict, Optional, Callable, Any
try:
    from agents import Agent, Runner, SQLiteSession
except ImportError:
    # Fallback if agents package structure is different
    try:
        from openai.agents import Agent, Runner, SQLiteSession
    except ImportError:
        raise ImportError("openai-agents package not installed. Run: pip install openai-agents")

# Tạm thời bỏ DualSession, chỉ dùng SQLiteSession
# from .memory.dual_session import DualSession

try:
    from openai import OpenAI
except ImportError:
    raise ImportError("openai package not installed. Run: pip install openai")

from .adb.adb_client import ADBClient
from .adb.uiautomator import UIAutomator
from .tools.device_tools import create_device_tools
from .tools.screen_tools import create_screen_tools
from .tools.interaction_tools import create_interaction_tools
from .tools.app_tools import create_app_tools

logger = logging.getLogger(__name__)


class MobileAgent:
    """Mobile agent with OpenAI Agents SDK"""

    def __init__(
        self,
        adb_client: ADBClient,
        ui_automator: UIAutomator,
        on_tool_started: Optional[Callable] = None,
        on_tool_completed: Optional[Callable] = None,
        on_response_update: Optional[Callable] = None,
        on_status_update: Optional[Callable] = None,
        on_thinking: Optional[Callable] = None,
        on_analysis: Optional[Callable] = None,
        on_plan_update: Optional[Callable] = None,
        on_workflow_update: Optional[Callable] = None,
    ):
        """
        Initialize mobile agent

        Args:
            adb_client: ADB client instance
            ui_automator: UI Automator instance
            on_tool_started: Callback when tool starts
            on_tool_completed: Callback when tool completes
            on_response_update: Callback for response updates
            on_status_update: Callback for status updates
            on_thinking: Callback for thinking events
            on_analysis: Callback for analysis events
            on_plan_update: Callback for plan updates
            on_workflow_update: Callback for workflow updates (with element info)
        """
        self.adb_client = adb_client
        self.ui_automator = ui_automator
        self.on_tool_started = on_tool_started
        self.on_tool_completed = on_tool_completed
        self.on_response_update = on_response_update
        self.on_status_update = on_status_update
        self.on_thinking = on_thinking
        self.on_analysis = on_analysis
        self.on_plan_update = on_plan_update
        self.on_workflow_update = on_workflow_update

        # Create all tools
        self.tools = []
        self.tools.extend(create_device_tools(adb_client))
        self.tools.extend(create_screen_tools(adb_client, ui_automator))
        self.tools.extend(create_interaction_tools(adb_client, ui_automator))
        self.tools.extend(create_app_tools(adb_client))

        # Agent will be created per session
        self.agent = None
        self.session = None
        # Track current agent config to recreate if changed
        self.current_api_key = None
        self.current_provider = None
        self.current_model = None

    def create_agent(
        self,
        provider: str = "openai",
        model: str = "gpt-4",
        api_key: Optional[str] = None,
    ) -> Agent:
        """
        Create agent with OpenAI provider

        Args:
            provider: Provider name (only "openai" supported)
            model: Model name
            api_key: OpenAI API key

        Returns:
            Agent instance
        """
        # Only support OpenAI
        if provider != "openai":
            raise ValueError(f"Only OpenAI provider is supported. Got: {provider}")

        if not api_key:
            raise ValueError("OpenAI API key required")

        client = OpenAI(api_key=api_key)

        # Map model names to latest available models
        model_map = {
            "gpt-5": "gpt-5-2025-08-07",  # GPT-5 model (latest)
            "gpt-5-mini": "gpt-5-mini-2025-08-07",  # GPT-5 Mini model
            "gpt-4o": "gpt-4o-2024-11-20",
            "gpt-4o-mini": "gpt-4o-mini-2024-07-18",
            "gpt-4": "gpt-4-turbo-preview",
            "gpt-4-turbo": "gpt-4-turbo-preview",
            "gpt-3.5-turbo": "gpt-3.5-turbo",
            "o1-preview": "o1-preview-2024-09-12",
            "o1-mini": "o1-mini-2024-09-12",
            "o3-mini": "o3-mini-2024-09-12",  # Latest O3 model
        }
        model = model_map.get(model, model)

        # Create agent with intelligent automation instructions
        instructions = """You are an intelligent mobile automation agent with advanced reasoning and planning capabilities.
You can control Android devices through ADB commands and execute complex multi-step tasks autonomously.

## Core Capabilities:
- **Intelligent Planning**: Break down complex tasks into logical steps and adapt plans dynamically
- **Visual Analysis**: Analyze screenshots to understand UI state and make decisions
- **Element-based Interaction**: Always use element-based tools (never coordinates)
- **Adaptive Problem Solving**: When something doesn't work, analyze why and try alternative approaches
- **Dynamic Decision Making**: Make intelligent decisions based on current screen state

## Intelligent Workflow Pattern:

### 1. Task Understanding & Planning Phase:
- Understand the user's goal completely
- Break down into logical steps (e.g., "Open Facebook → Wait for app → Find posts → Like 5 posts")
- Consider edge cases and potential obstacles
- Create a flexible plan that can adapt

### 2. Execution Phase with Continuous Reasoning:

**CRITICAL RULE: ALWAYS PLAN BEFORE ACTING, ALWAYS VERIFY AFTER ACTING**

For each step, follow this mandatory intelligent loop:

**A. PLAN First (Never guess, always plan):**
- Before doing ANY action, create a clear plan
- State your goal: "I need to [specific goal]"
- Analyze what you need: "To achieve this, I need to [specific steps]"
- Predict expected outcome: "After this action, I expect to see [expected result]"
- NEVER act without a plan - planning prevents mistakes

**B. Observe Current State:**
- Take a screenshot to see what's on screen (MANDATORY before any action)
- Analyze the screenshot: What do you see? What's the current state?
- List UI elements to understand available actions
- Compare current state with your plan: "Does what I see match my plan?"

**C. Execute Action (Only after planning and observation):**
- Execute the planned action
- Use element-based tools (mobile_click_element, mobile_swipe_element, etc.)
- Wait appropriately (10-15 seconds after opening apps, 2-3 seconds after clicks)

**D. VERIFY Result (MANDATORY after every action):**
- **ALWAYS take a screenshot immediately after every action**
- Compare actual result with expected result from your plan
- Ask: "Did the action work? What changed? Is this what I expected?"
- Analyze the new screenshot: "What do I see now? What's the new state?"

**E. Plan Next Step (Based on verification):**
- Based on verification screenshot, plan your next action
- If action succeeded: "Good, now I need to [next step]"
- If action failed: "This didn't work because [reason], I should try [alternative]"
- If unexpected result: "I see [unexpected], I should [adapt plan]"
- NEVER proceed without verifying and planning next step

### 3. Intelligent Decision Making Rules:

**MANDATORY Workflow for Every Action:**
1. **PLAN**: "I will [action] to achieve [goal], expecting to see [result]"
2. **OBSERVE**: Take screenshot, analyze current state
3. **EXECUTE**: Perform the planned action
4. **VERIFY**: Take screenshot, compare with expected result
5. **ADAPT**: Based on verification, plan next step

**When analyzing a screenshot (BEFORE action):**
- Plan what you expect to see
- If you see what you need → Plan the action, then execute
- If you don't see what you need → Plan to scroll/search, then execute
- If you see loading indicators → Plan to wait, then execute
- If you see error messages → Plan alternative approach, then execute

**When verifying after action (AFTER action):**
- **ALWAYS take screenshot after every action**
- Compare: "Did I get what I expected?"
- If yes → Plan next step based on new state
- If no → Analyze why, plan alternative, verify again
- If unexpected → Analyze new state, adapt plan accordingly

**When scrolling/searching:**
- Scroll in logical directions (down for feeds, up for navigation)
- After each scroll, take a screenshot and analyze
- Keep track of how many times you've scrolled to avoid infinite loops
- If you've scrolled multiple times without finding target, try alternative approach

**When waiting:**
- After opening apps: Wait 10-15 seconds for app to fully load
- After clicking: Wait 2-3 seconds for UI to update
- After scrolling: Wait 1-2 seconds for content to load
- Use mobile_wait_for_device if needed for longer waits

**When retrying:**
- If an action fails, analyze the screenshot to understand why
- Try alternative elements (different text, resource_id, etc.)
- Try scrolling first if element might be off-screen
- Try waiting longer if app seems slow
- After 3-4 failed attempts, reconsider your approach

### 4. Example: "Open Facebook and like 5 posts"

**Step 1: Find and Open App**
- List apps to find Facebook
- Launch Facebook app
- Wait 10-15 seconds for app to load

**Step 2: Navigate to Feed**
- Take screenshot to see current state
- Analyze: Are we on the feed? Do we see posts?
- If not on feed, find and click "Home" or "Feed" button
- Wait 5 seconds for feed to load

**Step 3: Find and Like Posts (Repeat 5 times)**
For each post:
- **PLAN**: "I need to find and like a post. I'll look for like buttons on screen."
- **OBSERVE**: Take screenshot to analyze current view
- **ANALYZE**: Look for like buttons (heart icon, "Like" text, etc.) in the screenshot
- **PLAN ACTION**:
  - If like button visible → "I see a like button at [element description], I'll click it and expect to see it change to 'liked' state"
  - If like button NOT visible → "I don't see a like button, I'll scroll down to find more posts, then take screenshot again"
- **EXECUTE**: Click like button OR scroll down
- **VERIFY**:
  - After click: Take screenshot, check if like button changed to "liked" state
  - After scroll: Take screenshot, analyze if new posts appeared
- **ADAPT**:
  - If like succeeded → "Good, I've liked 1 post. I need 4 more. Let me find the next one."
  - If like failed → "The click didn't work, let me analyze why and try different element"
  - If scroll didn't show posts → "I scrolled but no new posts, let me scroll more or try different approach"
- Track how many posts you've liked
- Continue until you've liked 5 posts

**Step 4: Verify Completion**
- Take final screenshot
- Confirm you've liked 5 posts
- Report success

### 5. Critical Rules (MANDATORY):

1. **ALWAYS PLAN BEFORE ACTING** - Never guess, never act without a clear plan
2. **ALWAYS VERIFY AFTER ACTING** - Take screenshot after EVERY action to verify result
3. **NEVER hard code** - Always analyze screenshots and adapt dynamically
4. **ALWAYS use element-based tools** - Never use coordinates
5. **Think → Plan → Observe → Execute → Verify → Adapt** - This is the mandatory cycle
6. **Be patient** - Wait appropriately for apps and UI to load
7. **Be persistent** - If something doesn't work, analyze why and try different approaches
8. **Be observant** - Screenshots tell you everything, analyze them carefully
9. **Adapt dynamically** - Plans should change based on verification results
10. **No blind actions** - Every action must have a plan and verification

### 6. Tool Usage:

- `mobile_take_screenshot`: Returns file_id (saves tokens) - Use this to see current state
- `mobile_list_elements_on_screen`: Get all clickable elements to find what you need
- `mobile_click_element`: Click elements by text, resource_id, description, or class
- `mobile_swipe_element`: Scroll by swiping between elements or in directions
- `mobile_list_apps`: Find apps by name
- `mobile_launch_app`: Open apps by package name
- `mobile_wait_for_device`: Wait for device to be ready

Remember: You are an intelligent agent. Think, reason, adapt, and solve problems dynamically. Every screenshot is an opportunity to understand and make better decisions."""

        # Create agent according to OpenAI Agents SDK documentation
        # Agent reads API key from OPENAI_API_KEY environment variable
        # Set API key in environment for this agent instance
        import os

        # Store original key to restore later if needed
        self._original_api_key = os.environ.get("OPENAI_API_KEY")

        # Set API key from frontend - Agent SDK will use this
        os.environ["OPENAI_API_KEY"] = api_key

        logger.info(f"Creating Agent with model={model}, api_key={api_key[:8]}... (from frontend)")

        # Create agent - it will use OPENAI_API_KEY from environment
        agent = Agent(
            name="MobileAssistant",
            instructions=instructions,
            tools=self.tools,
            model=model,  # Model from frontend
        )

        self.agent = agent
        # Track config when agent is created
        self.current_api_key = api_key
        self.current_provider = provider
        self.current_model = model
        return agent

    def _format_run_item(self, item: Any) -> Dict[str, Any]:
        """
        Format a RunItem to dict for frontend consumption using SDK attributes directly

        According to SDK docs, RunItem objects have direct attributes, no need to parse raw_item

        Args:
            item: RunItem from agents package

        Returns:
            Formatted dict with type and relevant data
        """
        try:
            # Import RunItem types
            from agents.items import (
                MessageOutputItem,
                ToolCallItem,
                ToolCallOutputItem,
                ReasoningItem,
                HandoffCallItem,
                HandoffOutputItem,
            )

            # Use isinstance for type checking (more reliable than string comparison)
            if isinstance(item, MessageOutputItem):
                # Use attributes directly from SDK
                content = getattr(item, 'content', '')
                if isinstance(content, list):
                    # Extract text from content parts
                    text_parts = []
                    for part in content:
                        if isinstance(part, dict) and part.get('type') == 'text':
                            text_parts.append(part.get('text', ''))
                        elif isinstance(part, str):
                            text_parts.append(part)
                    content = ''.join(text_parts)
                elif not isinstance(content, str):
                    content = str(content) if content else ''

                return {
                    "type": "message_output_item",
                    "content": content,
                }

            elif isinstance(item, ToolCallItem):
                # Use attributes directly from SDK
                tool_id = getattr(item, 'id', None)
                tool_name = getattr(item, 'name', None)
                arguments = getattr(item, 'arguments', {})

                # Parse arguments using helper method
                arguments = self._parse_arguments(arguments)

                # Format arguments as JSON string for frontend
                args_str = json.dumps(arguments) if arguments else "{}"

                return {
                    "type": "tool_call_item",
                    "id": tool_id,
                    "function": {
                        "name": tool_name,
                        "arguments": args_str,
                    },
                }

            elif isinstance(item, ToolCallOutputItem):
                # Use attributes directly from SDK
                output = getattr(item, 'output', None)

                # Format output for JSON serialization
                if output is not None and not isinstance(output, (dict, str, int, float, bool, type(None))):
                    # Try to convert complex objects to dict or string
                    if hasattr(output, '__dict__'):
                        output = output.__dict__
                    else:
                        output = str(output)

                return {
                    "type": "tool_call_output_item",
                    "output": output,
                }

            elif isinstance(item, ReasoningItem):
                # Use attributes directly from SDK
                reasoning = getattr(item, 'reasoning', '')
                if not isinstance(reasoning, str):
                    reasoning = str(reasoning) if reasoning else ''

                return {
                    "type": "reasoning_item",
                    "reasoning": reasoning,
                }

            elif isinstance(item, HandoffCallItem):
                # Use attributes directly from SDK
                tool_id = getattr(item, 'id', None)
                tool_name = getattr(item, 'name', None)

                return {
                    "type": "handoff_call_item",
                    "id": tool_id,
                    "function": {
                        "name": tool_name,
                    },
                }

            elif isinstance(item, HandoffOutputItem):
                # Use attributes directly from SDK
                source_agent = getattr(item, 'source_agent', None)
                target_agent = getattr(item, 'target_agent', None)

                return {
                    "type": "handoff_output_item",
                    "source_agent": getattr(source_agent, 'name', None) if source_agent else None,
                    "target_agent": getattr(target_agent, 'name', None) if target_agent else None,
                }

            # Unknown item type
            else:
                return {
                    "type": "unknown_item",
                    "raw_item": str(item),
                }

        except Exception as e:
            logger.warning(f"Error formatting run item: {e}")
            return {
                "type": "error_item",
                "error": str(e),
                "raw_item": str(item),
            }

    def _extract_new_items(self, result: Any) -> list[Dict[str, Any]]:
        """
        Extract and format new_items from RunResult

        Args:
            result: RunResult from Runner.run() or Runner.run_streamed()

        Returns:
            List of formatted items
        """
        formatted_items = []

        try:
            # Use new_items from RunResult (standard according to SDK docs)
            if hasattr(result, 'new_items') and result.new_items:
                for item in result.new_items:
                    formatted_item = self._format_run_item(item)
                    formatted_items.append(formatted_item)
        except Exception as e:
            logger.warning(f"Error extracting new_items: {e}")

        return formatted_items

    def _parse_arguments(self, arguments: Any) -> dict:
        """
        Parse arguments from string or dict format

        Args:
            arguments: Arguments as string (JSON) or dict

        Returns:
            Parsed arguments as dict
        """
        if isinstance(arguments, dict):
            return arguments
        elif isinstance(arguments, str):
            try:
                return self._parse_arguments(arguments)
            except:
                return {}
        else:
            return {}

    def _extract_tool_calls_from_new_items(self, formatted_new_items: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        """
        Extract tool calls from formatted new_items for backward compatibility

        Args:
            formatted_new_items: List of formatted items from _extract_new_items()

        Returns:
            List of tool call dicts with id, function, and status
        """
        tool_calls_from_items = []
        for item in formatted_new_items:
            if item.get("type") == "tool_call_item":
                tool_calls_from_items.append({
                    "id": item.get("id"),
                    "function": item.get("function"),
                    "status": "running"
                })
            elif item.get("type") == "tool_call_output_item":
                # Update corresponding tool call status
                tool_call_id = item.get("id") if item.get("id") else None
                for tc in tool_calls_from_items:
                    if tc.get("id") == tool_call_id:
                        tc["status"] = "completed"
                        tc["result"] = item.get("output")
                        break
        return tool_calls_from_items

    def _extract_intelligent_plan(
        self,
        formatted_new_items: list[Dict[str, Any]],
        tool_calls: list[Dict[str, Any]],
        final_output: str = "",
    ) -> Optional[Dict[str, Any]]:
        """
        Extract intelligent plan from reasoning items, tool calls, and final output

        This method creates a smart task plan by:
        1. Extracting reasoning/thinking from ReasoningItem
        2. Parsing structured plan from final_output (if contains plan tags)
        3. Building plan from tool calls with intelligent grouping
        4. Extracting next steps from reasoning

        Args:
            formatted_new_items: List of formatted items from SDK
            tool_calls: List of tool calls (extracted from new_items)
            final_output: Final output text from agent

        Returns:
            Plan dict with steps, currentStep, next_action, summary, or None
        """
        import re

        plan_steps = []
        reasoning_texts = []
        next_steps = []

        # 1. Extract reasoning from ReasoningItem
        for item in formatted_new_items:
            if item.get("type") == "reasoning_item":
                reasoning = item.get("reasoning", "")
                if reasoning:
                    reasoning_texts.append(reasoning)
                    # Try to extract plan steps from reasoning
                    # Look for numbered steps, bullet points, or structured plan
                    step_patterns = [
                        r'(?:Step\s+\d+|Bước\s+\d+)[:\.]\s*(.+?)(?=\n|Step|Bước|$)',
                        r'(?:^\d+\.|^[-*])\s*(.+?)(?=\n|$)',
                        r'(\d+\)\s*.+?)(?=\n|\d+\)|$)',
                    ]
                    for pattern in step_patterns:
                        matches = re.findall(pattern, reasoning, re.MULTILINE | re.IGNORECASE)
                        if matches:
                            next_steps.extend([m.strip() for m in matches if m.strip()])
                            break

        # 2. Parse structured plan from final_output (if contains plan tags)
        plan_from_output = None
        if final_output:
            # Look for structured plan in format: <plan>...</plan> or similar
            plan_tag_pattern = r'<plan>([\s\S]*?)</plan>'
            plan_match = re.search(plan_tag_pattern, final_output, re.IGNORECASE)
            if plan_match:
                plan_content = plan_match.group(1).strip()
                # Try to parse steps from plan content
                step_lines = [line.strip() for line in plan_content.split('\n') if line.strip()]
                if step_lines:
                    plan_from_output = {
                        "steps": step_lines,
                        "source": "final_output"
                    }

        # 3. Build plan from tool calls with intelligent grouping
        # Group related tool calls into logical steps
        tool_groups = []
        current_group = []

        for idx, tc in enumerate(tool_calls):
            tc_name = tc.get("function", {}).get("name", "unknown")
            tc_args = tc.get("function", {}).get("arguments", "{}")
            tc_status = tc.get("status", "running")

            args_dict = self._parse_arguments(tc_args)

            # Group screenshot + action pairs together
            if tc_name == "mobile_take_screenshot":
                # Start new group with screenshot
                if current_group:
                    tool_groups.append(current_group)
                current_group = [tc]
            elif current_group and current_group[0].get("function", {}).get("name") == "mobile_take_screenshot":
                # Add action to screenshot group
                current_group.append(tc)
            else:
                # Standalone action
                if current_group:
                    tool_groups.append(current_group)
                current_group = [tc]

        if current_group:
            tool_groups.append(current_group)

        # 4. Create plan steps from tool groups
        step_number = 1
        completed_count = 0

        for group in tool_groups:
            # Determine step description from group
            if len(group) == 1:
                # Single tool call
                tc = group[0]
                tc_name = tc.get("function", {}).get("name", "unknown")
                tc_args = tc.get("function", {}).get("arguments", "{}")
                args_dict = self._parse_arguments(tc_args)

                tool_display_name = tc_name.replace('mobile_', '').replace('_', ' ').title()
                description = tool_display_name

                # Add meaningful arguments to description
                if args_dict:
                    key_args = []
                    for key, value in args_dict.items():
                        if key != 'device' and value:
                            # Truncate long values
                            value_str = str(value)
                            if len(value_str) > 30:
                                value_str = value_str[:27] + "..."
                            key_args.append(f"{key}: {value_str}")
                    if key_args:
                        description += f" ({', '.join(key_args[:2])})"

                is_completed = tc.get("status") in ["completed", "error"]
                if is_completed:
                    completed_count += 1

                plan_steps.append({
                    "stepNumber": step_number,
                    "description": description,
                    "action": tc_name,
                    "arguments": args_dict,
                    "completed": is_completed,
                    "status": tc.get("status", "running"),
                })
                step_number += 1
            else:
                # Group of tools (screenshot + action)
                screenshot_tc = group[0]
                action_tc = group[1] if len(group) > 1 else None

                if action_tc:
                    tc_name = action_tc.get("function", {}).get("name", "unknown")
                    tc_args = action_tc.get("function", {}).get("arguments", "{}")
                    args_dict = self._parse_arguments(tc_args)

                    tool_display_name = tc_name.replace('mobile_', '').replace('_', ' ').title()
                    description = f"{tool_display_name}"

                    if args_dict:
                        key_args = []
                        for key, value in args_dict.items():
                            if key != 'device' and value:
                                value_str = str(value)
                                if len(value_str) > 30:
                                    value_str = value_str[:27] + "..."
                                key_args.append(f"{key}: {value_str}")
                        if key_args:
                            description += f" ({', '.join(key_args[:2])})"

                    is_completed = action_tc.get("status") in ["completed", "error"]
                    if is_completed:
                        completed_count += 1

                    plan_steps.append({
                        "stepNumber": step_number,
                        "description": description,
                        "action": tc_name,
                        "arguments": args_dict,
                        "completed": is_completed,
                        "status": action_tc.get("status", "running"),
                    })
                    step_number += 1

        # 5. Use plan from final_output if available and more detailed
        if plan_from_output and len(plan_from_output["steps"]) > len(plan_steps):
            # Merge: use descriptions from final_output, but keep status from tool calls
            output_steps = plan_from_output["steps"]
            for idx, step_desc in enumerate(output_steps):
                if idx < len(plan_steps):
                    # Update description but keep status
                    plan_steps[idx]["description"] = step_desc
                else:
                    # Add new step
                    plan_steps.append({
                        "stepNumber": idx + 1,
                        "description": step_desc,
                        "action": "unknown",
                        "arguments": {},
                        "completed": False,
                        "status": "pending",
                    })

        # 6. Build final plan structure
        # Always create plan if we have tool calls, even if no steps extracted
        # This ensures task list is always shown
        if not plan_steps and tool_calls:
            # Create minimal plan from tool calls if no steps were extracted
            for idx, tc in enumerate(tool_calls):
                tc_name = tc.get("function", {}).get("name", "unknown")
                tc_args = tc.get("function", {}).get("arguments", "{}")
                tc_status = tc.get("status", "running")
                args_dict = self._parse_arguments(tc_args)

                tool_display_name = tc_name.replace('mobile_', '').replace('_', ' ').title()
                description = tool_display_name

                if args_dict:
                    key_args = []
                    for key, value in args_dict.items():
                        if key != 'device' and value:
                            value_str = str(value)
                            if len(value_str) > 30:
                                value_str = value_str[:27] + "..."
                            key_args.append(f"{key}: {value_str}")
                    if key_args:
                        description += f" ({', '.join(key_args[:2])})"

                is_completed = tc_status in ["completed", "error"]
                if is_completed:
                    completed_count += 1

                plan_steps.append({
                    "stepNumber": idx + 1,
                    "description": description,
                    "action": tc_name,
                    "arguments": args_dict,
                    "completed": is_completed,
                    "status": tc_status,
                })

        if not plan_steps:
            return None

        is_complete = completed_count == len(plan_steps) and all(step.get("completed", False) for step in plan_steps)
        current_step = completed_count

        # Determine next action
        next_action = None
        if not is_complete and current_step < len(plan_steps):
            next_action = plan_steps[current_step].get("description")
        elif next_steps:
            next_action = next_steps[0]

        # Create summary
        if is_complete:
            summary = f"✅ Đã hoàn thành tất cả {len(plan_steps)} bước"
        else:
            summary = f"📋 Đang thực hiện: {completed_count}/{len(plan_steps)} bước"
            if next_action:
                summary += f" - Tiếp theo: {next_action[:50]}"

        return {
            "plan": {
                "steps": plan_steps,
                "currentStep": current_step,
                "totalSteps": len(plan_steps),
            },
            "next_action": next_action,
            "is_complete": is_complete,
            "summary": summary,
            "progress": {
                "steps": plan_steps,
                "currentStep": current_step,
                "isComplete": is_complete,
                "completed": completed_count,
                "total": len(plan_steps),
            }
        }

    def _extract_workflow_from_tool_calls(
        self,
        formatted_new_items: list[Dict[str, Any]],
        tool_calls: list[Dict[str, Any]],
        final_output: str = "",
    ) -> Optional[Dict[str, Any]]:
        """
        Extract workflow from tool calls with detailed element information

        This method creates a reusable workflow by:
        1. Extracting tool calls with element information
        2. Building nodes and edges for ReactFlow
        3. Including element details (resource_id, text, description, coordinates)
        4. Making workflow replayable

        Args:
            formatted_new_items: List of formatted items from SDK
            tool_calls: List of tool calls (extracted from new_items)
            final_output: Final output text from agent

        Returns:
            Workflow dict with nodes, edges, tool_calls, and metadata
        """
        if not tool_calls or len(tool_calls) == 0:
            return None

        nodes = []
        edges = []
        workflow_tool_calls = []

        # Process each tool call to create workflow nodes
        for idx, tc in enumerate(tool_calls):
            tc_id = tc.get("id") or f"tool-{idx}"
            tc_name = tc.get("function", {}).get("name", "unknown")
            tc_args = tc.get("function", {}).get("arguments", "{}")
            tc_status = tc.get("status", "running")
            tc_result = tc.get("result")

            # Parse arguments
            args_dict = self._parse_arguments(tc_args)

            # Extract element information from tool call result
            element_info = None
            coordinates = None

            # Try to extract element info from tool result
            if tc_result:
                if isinstance(tc_result, dict):
                    element_info = tc_result.get("element")
                    coordinates = tc_result.get("coordinates")
                elif isinstance(tc_result, str):
                    try:
                        import json
                        result_dict = json.loads(tc_result)
                        element_info = result_dict.get("element")
                        coordinates = result_dict.get("coordinates")
                    except:
                        pass

            # Build node description with element info
            tool_display_name = tc_name.replace('mobile_', '').replace('_', ' ').title()
            description_parts = []

            # Add element information to description
            if element_info:
                if isinstance(element_info, dict):
                    if element_info.get("text"):
                        description_parts.append(f"Text: {element_info.get('text')[:30]}")
                    if element_info.get("resource_id"):
                        description_parts.append(f"ID: {element_info.get('resource_id')[:30]}")
                    if element_info.get("description"):
                        description_parts.append(f"Desc: {element_info.get('description')[:30]}")
            elif args_dict:
                # Fallback to arguments if no element info
                if args_dict.get("text"):
                    description_parts.append(f"Text: {args_dict.get('text')[:30]}")
                if args_dict.get("resource_id"):
                    description_parts.append(f"ID: {args_dict.get('resource_id')[:30]}")
                if args_dict.get("description"):
                    description_parts.append(f"Desc: {args_dict.get('description')[:30]}")
                if args_dict.get("direction"):
                    description_parts.append(f"Direction: {args_dict.get('direction')}")

            description = ', '.join(description_parts[:2]) if description_parts else tool_display_name

            # Create ReactFlow node
            node = {
                "id": tc_id,
                "type": "custom",
                "position": {
                    "x": idx * 200,  # Horizontal layout
                    "y": 0
                },
                "data": {
                    "label": tool_display_name,
                    "description": description,
                    "status": tc_status,
                    "toolCall": {
                        "id": tc_id,
                        "function": {
                            "name": tc_name,
                            "arguments": args_dict,
                        },
                        "status": tc_status,
                        "result": tc_result,
                    },
                    "element": element_info,  # Store element info for replay
                    "coordinates": coordinates,  # Store coordinates for replay
                }
            }
            nodes.append(node)

            # Create edge from previous node
            if idx > 0:
                prev_tc_id = tool_calls[idx - 1].get("id") or f"tool-{idx - 1}"
                edge = {
                    "id": f"e-{prev_tc_id}-{tc_id}",
                    "source": prev_tc_id,
                    "target": tc_id,
                    "type": "smoothstep",
                    "animated": tc_status == "running",
                    "style": {
                        "stroke": "#3b82f6" if tc_status == "running" else "#10b981" if tc_status == "completed" else "#9ca3af",
                        "strokeWidth": 2.5,
                    },
                    "markerEnd": {
                        "type": "arrowclosed",
                        "color": "#3b82f6" if tc_status == "running" else "#10b981" if tc_status == "completed" else "#9ca3af",
                    },
                }
                edges.append(edge)

            # Store tool call with element info for workflow
            workflow_tool_call = {
                "id": tc_id,
                "function": {
                    "name": tc_name,
                    "arguments": args_dict,
                },
                "status": tc_status,
                "result": tc_result,
                "element": element_info,  # Include element info
                "coordinates": coordinates,  # Include coordinates
            }
            workflow_tool_calls.append(workflow_tool_call)

        # Build workflow metadata
        from datetime import datetime
        metadata = {
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source": "ai_agent",
            "device_id": tool_calls[0].get("function", {}).get("arguments", {}).get("device") if tool_calls else None,
            "total_steps": len(tool_calls),
            "completed_steps": sum(1 for tc in tool_calls if tc.get("status") == "completed"),
        }

        return {
            "nodes": nodes,
            "edges": edges,
            "tool_calls": workflow_tool_calls,
            "metadata": metadata,
            "name": f"Workflow - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "description": f"Auto-generated workflow from {len(tool_calls)} tool calls",
        }

    async def chat(
        self,
        message: str,
        session_id: str,
        provider: str = "openai",
        model: str = "gpt-4o",
        api_key: Optional[str] = None,
        max_turns: Optional[int] = None,
        workflow_replay: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process chat message with streaming support

        Args:
            message: User message
            session_id: Session ID
            provider: Provider name
            model: Model name
            api_key: API key

        Returns:
            Response dict
        """
        try:
            # Validate API key and model from frontend
            if not api_key or not api_key.strip():
                raise ValueError("API key is required (from frontend)")

            if not model or not model.strip():
                raise ValueError("Model is required (from frontend)")

            logger.info(f"Chat request: provider={provider}, model={model}, api_key={api_key[:8]}... (from frontend)")

            # Load max_turns from config if not provided
            # If None or null, set to very large number (9999) for unlimited turns
            if max_turns is None:
                try:
                    import yaml
                    import os
                    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "config.yaml")
                    if os.path.exists(config_path):
                        with open(config_path, "r") as f:
                            config = yaml.safe_load(f)
                            config_max_turns = config.get("agent", {}).get("max_turns")
                            # If config has null/None, use unlimited (9999)
                            if config_max_turns is None:
                                max_turns = 9999  # Unlimited
                            else:
                                max_turns = config_max_turns
                    else:
                        max_turns = 9999  # Default to unlimited
                except Exception as e:
                    logger.warning(f"Could not load max_turns from config: {e}, using unlimited (9999)")
                    max_turns = 9999

            # Ensure max_turns is at least 1 (SDK requirement)
            if max_turns is None or max_turns < 1:
                max_turns = 9999

            logger.info(f"Using max_turns: {max_turns} {'(unlimited)' if max_turns >= 9999 else ''}")

            # Create agent first (required before session)
            # Recreate agent if API key, provider, or model changed
            if (not self.agent or
                self.current_api_key != api_key or
                self.current_provider != provider or
                self.current_model != model):
                logger.info(f"Creating/recreating agent with new config: model={model}, provider={provider}")
                self.create_agent(provider=provider, model=model, api_key=api_key)
                # Track current config
                self.current_api_key = api_key
                self.current_provider = provider
                self.current_model = model

            # Create or get session - chỉ dùng SQLite (tạm thời bỏ Backend sync)
            # According to docs: https://openai.github.io/openai-agents-python/sessions/
            if not self.session or getattr(self.session, 'session_id', None) != session_id:
                import os
                # SQLite database path
                db_path = os.path.join(os.path.dirname(__file__), "..", "..", "conversations.db")
                os.makedirs(os.path.dirname(db_path), exist_ok=True)

                # Chỉ dùng SQLiteSession (tạm thời bỏ DualSession)
                # According to docs: SQLiteSession("user_123", "conversations.db")
                self.session = SQLiteSession(session_id, db_path)
                logger.info(f"Created SQLiteSession with session_id={session_id}, db_path={db_path}")

            # Runner doesn't need to be created separately - use Runner.run_streamed() directly

            # Send status update
            if self.on_status_update:
                self.on_status_update({
                    "status": "thinking",
                    "message": "Đang suy nghĩ...",
                })

            # Use streaming API according to official docs
            # Docs: https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultStreaming
            # Runner.run_streamed() returns RunResultStreaming with:
            # - current_turn, max_turns: turn tracking
            # - new_items: list of RunItem (MessageOutputItem, ToolCallItem, ToolCallOutputItem, etc.)
            # - stream_events(): async iterator for real-time text deltas
            # - final_output: final response text (available after streaming completes)

            try:
                # Create context object for tools (API key passed via ToolContext)
                # According to SDK docs: context is passed to tools via ToolContext.context
                context = {"api_key": api_key, "provider": provider, "model": model}

                # Call Runner.run_streamed() - returns RunResultStreaming immediately (NOT awaitable)
                logger.info(f"Calling Runner.run_streamed(agent, input=message, session=session, max_turns={max_turns})")
                result = Runner.run_streamed(self.agent, input=message, session=self.session, max_turns=max_turns, context=context)
                logger.info(f"✅ Runner.run_streamed successful! Result type: {type(result)}")

                # Get current_turn and max_turns directly from RunResultStreaming
                current_turn = getattr(result, 'current_turn', 0)
                result_max_turns = getattr(result, 'max_turns', max_turns)

                # Process streaming events - only handle text deltas for real-time updates
                # All tool calls, messages, etc. are available in result.new_items
                # Track last plan update to avoid sending too frequently
                last_plan_update_count = 0

                async for event in result.stream_events():
                    # Update current_turn from result (it updates as we stream)
                    current_turn = getattr(result, 'current_turn', current_turn)

                    # Send turn update via status
                    if self.on_status_update and current_turn > 0:
                        self.on_status_update({
                            "status": "running",
                            "message": f"Đang xử lý turn {current_turn}/{result_max_turns}",
                            "current_turn": current_turn,
                            "max_turns": result_max_turns,
                            "success": None,
                        })

                    # Check for new tool calls in result.new_items during streaming
                    # Send plan update real-time as tool calls are detected
                    if hasattr(result, 'new_items') and result.new_items:
                        try:
                            # Extract tool calls incrementally during streaming
                            current_formatted_items = self._extract_new_items(result)
                            current_tool_calls = self._extract_tool_calls_from_new_items(current_formatted_items)

                            # Only send plan update if tool calls count changed
                            if len(current_tool_calls) > last_plan_update_count:
                                last_plan_update_count = len(current_tool_calls)

                                # Get current final_output (may be partial during streaming)
                                current_final_output = getattr(result, 'final_output', '')

                                # Extract and send plan update
                                if self.on_plan_update and current_tool_calls:
                                    try:
                                        intelligent_plan = self._extract_intelligent_plan(
                                            formatted_new_items=current_formatted_items,
                                            tool_calls=current_tool_calls,
                                            final_output=current_final_output,
                                        )
                                        if intelligent_plan:
                                            self.on_plan_update(intelligent_plan)
                                            logger.debug(f"📋 Sent real-time plan update: {len(intelligent_plan.get('plan', {}).get('steps', []))} steps")
                                    except Exception as plan_error:
                                        logger.debug(f"Error extracting plan during streaming: {plan_error}")
                        except Exception as items_error:
                            logger.debug(f"Error processing new_items during streaming: {items_error}")

                    # Only handle text delta events for real-time streaming
                    # Tool calls and other items are in result.new_items (no need to parse manually)
                    # Note: We still need to accumulate deltas for real-time display since final_output
                    # may only be available after streaming completes
                    try:
                        # Check for text delta in event (for real-time text streaming)
                        if hasattr(event, 'data') and hasattr(event.data, 'delta'):
                            delta = event.data.delta
                            if delta:
                                # Use final_output from result if available, otherwise accumulate
                                # According to SDK docs, final_output may update during streaming
                                current_content = getattr(result, 'final_output', '')
                                if self.on_response_update:
                                    self.on_response_update({
                                        "content": current_content,
                                        "delta": delta,
                                        "isThinking": False,
                                    })
                    except Exception as delta_error:
                        logger.debug(f"Error processing text delta: {delta_error}")

                # After streaming completes, process new_items from RunResultStreaming
                # According to docs: new_items contains all RunItem objects (MessageOutputItem, ToolCallItem, etc.)
                logger.info(f"Processing new_items from RunResultStreaming: {len(result.new_items) if hasattr(result, 'new_items') and result.new_items else 0} items")

                # Extract and format new_items
                formatted_new_items = self._extract_new_items(result)

                # Extract tool calls from new_items using helper method
                tool_calls_from_items = self._extract_tool_calls_from_new_items(formatted_new_items)

                # Process tool calls from new_items for callbacks and updates
                for tc_item in tool_calls_from_items:
                    try:
                        tool_name = tc_item.get("function", {}).get("name")
                        tool_call_id = tc_item.get("id")
                        arguments_str = tc_item.get("function", {}).get("arguments", "{}")
                        arguments = self._parse_arguments(arguments_str)

                        if tool_name and tool_call_id:
                            # Trigger tool started callback
                            if self.on_tool_started:
                                self.on_tool_started({
                                    "tool": tool_name,
                                    "tool_call": tc_item,
                                    "arguments": arguments,
                                })

                            # Trigger tool completed callback if status is completed
                            if tc_item.get("status") == "completed" and self.on_tool_completed:
                                self.on_tool_completed({
                                    "tool": tool_name,
                                    "tool_call": tc_item,
                                    "success": True,
                                    "result": tc_item.get("result"),
                                })

                            # Send status update
                            if self.on_status_update:
                                status_msg = f"Đang thực thi: {tool_name.replace('mobile_', '').replace('_', ' ')}"
                                if tc_item.get("status") == "completed":
                                    status_msg = f"Đã hoàn thành: {tool_name.replace('mobile_', '').replace('_', ' ')}"
                                self.on_status_update({
                                    "status": "executing_tool" if tc_item.get("status") != "completed" else "completed",
                                    "message": status_msg,
                                    "tool": tool_name,
                                    "success": tc_item.get("status") == "completed",
                                })

                            # Send plan update immediately when tool call status changes
                            # This ensures task list updates in real-time
                            if self.on_plan_update:
                                try:
                                    # Re-extract tool calls to get latest status
                                    current_tool_calls = self._extract_tool_calls_from_new_items(formatted_new_items)
                                    current_final_output = getattr(result, 'final_output', '')

                                    intelligent_plan = self._extract_intelligent_plan(
                                        formatted_new_items=formatted_new_items,
                                        tool_calls=current_tool_calls,
                                        final_output=current_final_output,
                                    )
                                    if intelligent_plan:
                                        self.on_plan_update(intelligent_plan)
                                        logger.debug(f"📋 Sent plan update after tool call {tool_name}: {len(intelligent_plan.get('plan', {}).get('steps', []))} steps")
                                except Exception as plan_error:
                                    logger.debug(f"Error sending plan update after tool call: {plan_error}")
                    except Exception as tool_callback_error:
                        logger.warning(f"Error processing tool call callback: {tool_callback_error}")

                # Get final output from RunResultStreaming (SDK accumulates it automatically)
                final_output = getattr(result, 'final_output', '')

                # Get final current_turn from result
                current_turn = getattr(result, 'current_turn', current_turn)

                logger.info(f"Final output length: {len(final_output) if final_output else 0}, tool_calls count: {len(tool_calls_from_items)}")

                # Extract intelligent plan from new_items, tool calls, and final output
                # Send plan update real-time (not just at the end)
                # Always send plan update if we have tool calls (even if plan extraction fails, create minimal plan)
                if self.on_plan_update:
                    try:
                        intelligent_plan = None
                        if tool_calls_from_items or formatted_new_items:
                            intelligent_plan = self._extract_intelligent_plan(
                                formatted_new_items=formatted_new_items,
                                tool_calls=tool_calls_from_items,
                                final_output=final_output,
                            )

                        # If plan extraction failed but we have tool calls, create minimal plan
                        if not intelligent_plan and tool_calls_from_items:
                            logger.warning(f"Plan extraction returned None, creating minimal plan from {len(tool_calls_from_items)} tool calls")
                            # Create minimal plan directly from tool calls
                            plan_steps = []
                            completed_count = 0
                            for idx, tc in enumerate(tool_calls_from_items):
                                tc_name = tc.get("function", {}).get("name", "unknown")
                                tc_args = tc.get("function", {}).get("arguments", "{}")
                                tc_status = tc.get("status", "running")
                                args_dict = self._parse_arguments(tc_args)

                                tool_display_name = tc_name.replace('mobile_', '').replace('_', ' ').title()
                                description = tool_display_name

                                if args_dict:
                                    key_args = []
                                    for key, value in args_dict.items():
                                        if key != 'device' and value:
                                            value_str = str(value)
                                            if len(value_str) > 30:
                                                value_str = value_str[:27] + "..."
                                            key_args.append(f"{key}: {value_str}")
                                    if key_args:
                                        description += f" ({', '.join(key_args[:2])})"

                                is_completed = tc_status in ["completed", "error"]
                                if is_completed:
                                    completed_count += 1

                                plan_steps.append({
                                    "stepNumber": idx + 1,
                                    "description": description,
                                    "action": tc_name,
                                    "arguments": args_dict,
                                    "completed": is_completed,
                                    "status": tc_status,
                                })

                            if plan_steps:
                                is_complete = completed_count == len(plan_steps)
                                intelligent_plan = {
                                    "plan": {
                                        "steps": plan_steps,
                                        "currentStep": completed_count,
                                        "totalSteps": len(plan_steps),
                                    },
                                    "next_action": None if is_complete else (plan_steps[completed_count].get("description") if completed_count < len(plan_steps) else None),
                                    "is_complete": is_complete,
                                    "summary": f"📋 Đang thực hiện: {completed_count}/{len(plan_steps)} bước",
                                    "progress": {
                                        "steps": plan_steps,
                                        "currentStep": completed_count,
                                        "isComplete": is_complete,
                                        "completed": completed_count,
                                        "total": len(plan_steps),
                                    }
                                }

                        if intelligent_plan:
                            self.on_plan_update(intelligent_plan)
                            logger.info(f"✅ Sent intelligent plan update: {intelligent_plan.get('summary', 'N/A')} ({len(intelligent_plan.get('plan', {}).get('steps', []))} steps)")
                        else:
                            logger.warning(f"⚠️ No plan to send: tool_calls={len(tool_calls_from_items) if tool_calls_from_items else 0}, formatted_items={len(formatted_new_items) if formatted_new_items else 0}")
                    except Exception as plan_error:
                        logger.error(f"❌ Error extracting intelligent plan: {plan_error}", exc_info=True)

                # Extract workflow from tool calls with element information
                # Send workflow update for automatic saving and replay
                if self.on_workflow_update and tool_calls_from_items:
                    try:
                        workflow = self._extract_workflow_from_tool_calls(
                            formatted_new_items=formatted_new_items,
                            tool_calls=tool_calls_from_items,
                            final_output=final_output,
                        )
                        if workflow:
                            self.on_workflow_update(workflow)
                            logger.info(f"✅ Sent workflow update: {len(workflow.get('nodes', []))} nodes, {len(workflow.get('tool_calls', []))} tool calls")
                    except Exception as workflow_error:
                        logger.warning(f"Error extracting workflow: {workflow_error}")

            except Exception as stream_error:
                # Check if it's a rate limit error
                is_rate_limit = False
                retry_after = None

                # Check for OpenAI rate limit errors
                if hasattr(stream_error, 'status_code') and stream_error.status_code == 429:
                    is_rate_limit = True
                    if hasattr(stream_error, 'response') and hasattr(stream_error.response, 'headers'):
                        retry_after = stream_error.response.headers.get('retry-after')
                elif 'rate limit' in str(stream_error).lower() or 'Rate limit' in str(stream_error):
                    is_rate_limit = True
                    # Try to extract retry-after from error message
                    import re
                    retry_match = re.search(r'Please try again in ([\d.]+)s', str(stream_error))
                    if retry_match:
                        retry_after = float(retry_match.group(1))

                if is_rate_limit:
                    logger.warning(f"⚠️ Rate limit detected. Retry after: {retry_after}s" if retry_after else "⚠️ Rate limit detected")

                    # Notify user about rate limit
                    if self.on_status_update:
                        self.on_status_update({
                            "status": "rate_limit",
                            "message": f"Đang chờ rate limit... (thử lại sau {retry_after:.1f}s)" if retry_after else "Đang chờ rate limit...",
                            "success": None,
                        })

                    # Wait for retry_after seconds if available, otherwise wait 2 seconds
                    if retry_after:
                        import asyncio
                        wait_time = min(float(retry_after) + 0.5, 10.0)  # Add 0.5s buffer, max 10s
                        logger.info(f"⏳ Waiting {wait_time:.1f}s before retry...")
                        await asyncio.sleep(wait_time)
                    else:
                        import asyncio
                        await asyncio.sleep(2.0)  # Default wait 2 seconds

                    # Retry with non-streaming mode (more reliable for rate limits)
                    logger.info("🔄 Retrying with non-streaming mode...")
                    try:
                        context = {"api_key": api_key, "provider": provider, "model": model}
                        result = await Runner.run(self.agent, input=message, session=self.session, max_turns=max_turns, context=context)
                        final_output = getattr(result, 'final_output', str(result))

                        # Use new_items from SDK instead of manual extraction
                        formatted_new_items = self._extract_new_items(result)

                        # Extract tool calls from new_items using helper method
                        tool_calls_from_items = self._extract_tool_calls_from_new_items(formatted_new_items)
                        # Mark all as completed for rate limit retry case
                        for tc in tool_calls_from_items:
                            if tc.get("status") == "running":
                                tc["status"] = "completed"

                        # Process tool calls for callbacks
                        for tc_item in tool_calls_from_items:
                            try:
                                tool_name = tc_item.get("function", {}).get("name")
                                tool_call_id = tc_item.get("id")
                                arguments_str = tc_item.get("function", {}).get("arguments", "{}")
                                arguments = self._parse_arguments(arguments_str)

                                if tool_name and tool_call_id and self.on_tool_started:
                                    self.on_tool_started({
                                        "tool": tool_name,
                                        "tool_call": tc_item,
                                        "arguments": arguments,
                                    })
                            except Exception as callback_err:
                                logger.warning(f"Error in tool_started callback for fallback: {callback_err}")

                        # Update status
                        current_turn = getattr(result, 'current_turn', 0)
                        result_max_turns = getattr(result, 'max_turns', max_turns)
                        if self.on_status_update:
                            self.on_status_update({
                                "status": "completed",
                                "message": f"Đã hoàn thành (non-streaming mode, turn {current_turn}/{result_max_turns})",
                                "success": True,
                                "current_turn": current_turn,
                                "max_turns": result_max_turns,
                            })
                    except Exception as retry_error:
                        logger.error(f"Retry also failed: {retry_error}")
                        if self.on_status_update:
                            self.on_status_update({
                                "status": "error",
                                "message": f"Lỗi rate limit: {str(stream_error)[:100]}",
                                "success": False,
                            })
                        final_output = f"Lỗi: Rate limit từ OpenAI API. Vui lòng thử lại sau vài giây."
                        formatted_new_items = []
                        tool_calls_from_items = []
                else:
                    # Check if it's an invalid image_url error (common with GPT-5 and old session data)
                    error_str = str(stream_error)
                    is_invalid_image_url = (
                        'invalid' in error_str.lower() and
                        'image_url' in error_str.lower() and
                        'base64' in error_str.lower()
                    )

                    if is_invalid_image_url:
                        logger.error(f"❌ Invalid image_url error detected. This happens when session history contains old base64 image_url data.")
                        logger.error(f"   The new code never uses base64, but old session history may still contain it.")
                        logger.error(f"   Solution: Creating fresh session to avoid corrupted image_url data...")

                        # Create a fresh session to avoid corrupted image_url data from old session history
                        import os
                        import time
                        db_path = os.path.join(os.path.dirname(__file__), "..", "..", "conversations.db")
                        # Create new session with fresh ID (avoids loading old session history with base64)
                        fresh_session_id = f"{session_id}_fresh_{int(time.time())}"
                        self.session = SQLiteSession(fresh_session_id, db_path)
                        logger.info(f"✅ Created fresh session: {fresh_session_id} (old session had corrupted base64 data)")

                        # Notify user
                        if self.on_status_update:
                            self.on_status_update({
                                "status": "retrying",
                                "message": "Đang tạo session mới để tránh lỗi dữ liệu hình ảnh cũ trong lịch sử...",
                                "success": None,
                            })

                        # Retry with fresh session (non-streaming mode for simplicity)
                        try:
                            logger.info(f"🔄 Retrying with fresh session (non-streaming mode)...")
                            context = {"api_key": api_key, "provider": provider, "model": model}
                            result = await Runner.run(self.agent, input=message, session=self.session, max_turns=max_turns, context=context)
                            final_output = getattr(result, 'final_output', str(result))

                            # Use new_items from SDK instead of manual extraction
                            formatted_new_items = self._extract_new_items(result)

                            # Extract tool calls from new_items using helper method
                            tool_calls_from_items = self._extract_tool_calls_from_new_items(formatted_new_items)
                            # Mark all as completed for retry case
                            for tc in tool_calls_from_items:
                                if tc.get("status") == "running":
                                    tc["status"] = "completed"

                            # Process tool calls for callbacks
                            for tc_item in tool_calls_from_items:
                                try:
                                    tool_name = tc_item.get("function", {}).get("name")
                                    tool_call_id = tc_item.get("id")
                                    arguments_str = tc_item.get("function", {}).get("arguments", "{}")
                                    arguments = self._parse_arguments(arguments_str)

                                    if tool_name and tool_call_id and self.on_tool_started:
                                        self.on_tool_started({
                                            "tool": tool_name,
                                            "tool_call": tc_item,
                                            "arguments": arguments,
                                        })
                                except Exception as callback_err:
                                    logger.warning(f"Error in tool_started callback for retry: {callback_err}")

                            logger.info(f"✅ Retry with fresh session succeeded")
                        except Exception as retry_error:
                            logger.error(f"❌ Retry with fresh session also failed: {retry_error}")
                            # Raise error to be caught by outer exception handler
                            error_message = f"Lỗi: {str(retry_error)}. Vui lòng tạo session mới hoặc xóa session hiện tại."
                            if self.on_status_update:
                                self.on_status_update({
                                    "status": "error",
                                    "message": error_message,
                                    "success": False,
                                })
                            # Return error response instead of continuing
                            return {
                                "success": False,
                                "error": error_message,
                                "content": error_message,
                                "final_output": error_message,
                                "session_id": session_id,
                            }
                    else:
                        # Fallback to regular run if streaming fails (non-rate-limit errors)
                        import traceback
                        error_line = traceback.extract_tb(stream_error.__traceback__)[-1].lineno if stream_error.__traceback__ else 'unknown'
                        logger.error(f"Streaming failed at line {error_line}: {type(stream_error).__name__}: {stream_error}", exc_info=True)
                        logger.warning(f"Falling back to regular Runner.run()")
                        context = {"api_key": api_key, "provider": provider, "model": model}
                        result = await Runner.run(self.agent, input=message, session=self.session, max_turns=max_turns, context=context)
                        final_output = getattr(result, 'final_output', str(result))

                        # Use new_items from SDK instead of manual extraction
                        formatted_new_items = self._extract_new_items(result)

                        # Extract tool calls from new_items using helper method
                        tool_calls_from_items = self._extract_tool_calls_from_new_items(formatted_new_items)
                        # Mark all as completed for rate limit retry case
                        for tc in tool_calls_from_items:
                            if tc.get("status") == "running":
                                tc["status"] = "completed"

                        # Process tool calls for callbacks
                        for tc_item in tool_calls_from_items:
                            try:
                                tool_name = tc_item.get("function", {}).get("name")
                                tool_call_id = tc_item.get("id")
                                arguments_str = tc_item.get("function", {}).get("arguments", "{}")
                                arguments = self._parse_arguments(arguments_str)

                                if tool_name and tool_call_id and self.on_tool_started:
                                    self.on_tool_started({
                                        "tool": tool_name,
                                        "tool_call": tc_item,
                                        "arguments": arguments,
                                    })
                            except Exception as callback_err:
                                logger.warning(f"Error in tool_started callback for fallback: {callback_err}")

            # Send final content update (for both streaming and non-streaming)
            if self.on_response_update:
                # Extract new_items from result (already done for streaming, do it again for fallback)
                if 'formatted_new_items' not in locals():
                    formatted_new_items = self._extract_new_items(result)

                # Format tool calls from new_items for backward compatibility
                formatted_tool_calls = None
                if 'tool_calls_from_items' in locals() and tool_calls_from_items:
                    formatted_tool_calls = tool_calls_from_items
                elif hasattr(result, 'new_items') and result.new_items:
                    # Extract tool calls from new_items using helper method
                    tool_calls_from_items = self._extract_tool_calls_from_new_items(formatted_new_items)
                    # Mark all as completed for fallback case
                    for tc in tool_calls_from_items:
                        if tc.get("status") == "running":
                            tc["status"] = "completed"
                    formatted_tool_calls = tool_calls_from_items if tool_calls_from_items else None

                self.on_response_update({
                    "content": final_output,
                    "delta": None,
                    "new_items": formatted_new_items,  # Standard format from OpenAI Agents SDK
                    "tool_calls": formatted_tool_calls,  # Backward compatibility
                    "has_tool_calls": len(formatted_tool_calls) > 0 if formatted_tool_calls else False,
                    "isThinking": False,
                })

                # Send final plan update using intelligent plan extraction
                # This is a fallback if plan wasn't sent during streaming
                if self.on_plan_update and formatted_tool_calls:
                    try:
                        # Ensure we have formatted_new_items and final_output
                        if 'formatted_new_items' not in locals():
                            formatted_new_items = self._extract_new_items(result)
                        if 'final_output' not in locals():
                            final_output = getattr(result, 'final_output', '')

                        # Use intelligent plan extraction (same as during streaming)
                        intelligent_plan = self._extract_intelligent_plan(
                            formatted_new_items=formatted_new_items,
                            tool_calls=formatted_tool_calls,
                            final_output=final_output,
                        )
                        if intelligent_plan:
                            self.on_plan_update(intelligent_plan)
                            logger.info(f"✅ Sent final intelligent plan update: {intelligent_plan.get('summary', 'N/A')}")
                    except Exception as plan_final_error:
                        logger.warning(f"Error sending final plan update: {plan_final_error}")

            # Send completion status
            if self.on_status_update:
                # Get final current_turn and max_turns from result
                final_current_turn = getattr(result, 'current_turn', current_turn if 'current_turn' in locals() else 0)
                final_max_turns = getattr(result, 'max_turns', result_max_turns if 'result_max_turns' in locals() else max_turns)

                self.on_status_update({
                    "status": "completed",
                    "message": f"Hoàn thành (turn {final_current_turn}/{final_max_turns})",
                    "success": True,
                    "current_turn": final_current_turn,
                    "max_turns": final_max_turns,
                })

            # Extract new_items from result (if not already extracted)
            if 'formatted_new_items' not in locals():
                formatted_new_items = self._extract_new_items(result)

            # Extract last_agent if available
            last_agent = None
            if hasattr(result, 'last_agent') and result.last_agent:
                last_agent = {
                    "name": getattr(result.last_agent, 'name', None),
                }

            # Extract raw_responses if available (optional, might be large)
            raw_responses = None
            if hasattr(result, 'raw_responses') and result.raw_responses:
                # Only include basic info, not full responses to avoid large payloads
                raw_responses = {
                    "count": len(result.raw_responses) if isinstance(result.raw_responses, list) else 1,
                }

            # Format tool_calls for backward compatibility
            backward_compat_tool_calls = None
            if 'tool_calls_from_items' in locals() and tool_calls_from_items:
                backward_compat_tool_calls = tool_calls_from_items
            elif formatted_new_items:
                # Extract tool calls from new_items using helper method
                backward_compat_tool_calls = self._extract_tool_calls_from_new_items(formatted_new_items)
                # Mark all as completed for final response
                for tc in backward_compat_tool_calls:
                    if tc.get("status") == "running":
                        tc["status"] = "completed"

            return {
                "success": True,
                "final_output": final_output,
                "content": final_output,  # Backward compatibility
                "new_items": formatted_new_items,  # Standard format from OpenAI Agents SDK
                "last_agent": last_agent,
                "tool_calls": backward_compat_tool_calls,  # Backward compatibility
                "session_id": session_id,
                "raw_responses": raw_responses,
            }
        except Exception as e:
            import traceback
            error_line = traceback.extract_tb(e.__traceback__)[-1].lineno if e.__traceback__ else 'unknown'
            logger.error(f"Error in chat at line {error_line}: {type(e).__name__}: {e}", exc_info=True)
            if self.on_status_update:
                self.on_status_update({
                    "status": "error",
                    "message": f"Lỗi: {str(e)}",
                    "success": False,
                })
            return {
                "success": False,
                "error": str(e),
            }

    def stop(self):
        """Stop current agent execution"""
        # TODO: Implement stop functionality when available in SDK
        logger.warning("Stop functionality not yet implemented in OpenAI Agents SDK")
        if self.on_status_update:
            self.on_status_update({
                "status": "stopped",
                "message": "Đã dừng",
            })

