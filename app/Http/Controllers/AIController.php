<?php

namespace App\Http\Controllers;

use App\Services\OpenAIService;
use App\Services\GeminiService;
use App\Services\ClaudeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    private $aiService;

    public function __construct(
        private OpenAIService $openAIService,
        private GeminiService $geminiService,
        private ClaudeService $claudeService
    ) {
        // Chọn AI provider dựa trên config
        $provider = config('services.ai.provider', 'openai');
        $this->aiService = match($provider) {
            'gemini' => $geminiService,
            'claude' => $claudeService,
            default => $openAIService
        };

        Log::info('[AI Controller] Using AI provider', ['provider' => $provider]);
    }

    /**
     * AI Proxy Gateway - Chỉ proxy AI API, không xử lý logic MCP
     * Local-app tự build messages, system prompt, context và gửi đến đây
     * Laravel chỉ forward đến AI API và trả về response
     *
     * TODO: Thêm authentication/authorization ở đây khi cần
     */
    public function chatWithPhone(Request $request): JsonResponse
    {
        $request->validate([
            'messages' => 'required|array', // Messages đã được build sẵn từ agent-bridge (bao gồm tool_results)
            'tools' => 'nullable|array', // Tools từ agent-bridge
            'model' => 'required|string', // Model selection: gpt-4o-mini, gemini-1.5-flash, claude-3-5-sonnet, etc.
            'provider' => 'required|string', // Provider: openai, gemini, claude
        ]);

        // Select AI service based on request
        $provider = $request->provider;
        $model = $request->model;
        $messages = $request->messages;
        $tools = $request->tools ?? [];

        $aiService = match($provider) {
            'gemini' => $this->geminiService,
            'claude' => $this->claudeService,
            default => $this->openAIService
        };

        try {
            Log::info('[AI Proxy] Laravel BE received AI proxy request', [
                'provider' => $provider,
                'model' => $model,
                'messages_count' => count($messages),
                'has_tools' => !empty($tools)
            ]);

            // TODO: Thêm authentication/authorization check ở đây
            // if (!auth()->check()) {
            //     return response()->json(['error' => 'Unauthorized'], 401);
            // }

            // Proxy request đến AI service - chỉ forward messages, tools, model
            $response = $aiService->chat($messages, $tools, $model);

            // Validate response
            if (empty($response) || !is_array($response)) {
                Log::error('[AI Proxy] Invalid response from AI service', ['response' => $response]);
                throw new \Exception('AI service trả về response không hợp lệ');
            }

            Log::info('[AI Proxy] AI response received', [
                'has_content' => !empty($response['content']),
                'has_tool_calls' => !empty($response['tool_calls']),
                'tool_calls_count' => count($response['tool_calls'] ?? [])
            ]);

            // Trả về response nguyên bản từ AI service
            return response()->json([
                'content' => $response['content'] ?? null,
                'tool_calls' => $response['tool_calls'] ?? null,
                'role' => $response['role'] ?? 'assistant',
            ]);

        } catch (\Exception $e) {
            Log::error('[AI Proxy] Error proxying AI request', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Lỗi khi proxy AI request: ' . $e->getMessage(),
                'content' => 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. ' . $e->getMessage()
            ], 500);
        }
    }

    // Removed buildSystemPrompt - Local-app tự build system prompt

    /**
     * Get available MCP tools for AI
     * Note: Frontend should call agent-bridge directly for MCP tools
     * This endpoint is kept for backward compatibility but returns empty
     */
    public function getTools(): JsonResponse
    {
            return response()->json([
            'mcp_tools' => [],
            'ai_tools' => [],
            'provider' => config('services.ai.provider', 'openai'),
            'message' => 'Frontend should call agent-bridge directly at http://127.0.0.1:3001/api/mcp/tools'
        ]);
    }
}

