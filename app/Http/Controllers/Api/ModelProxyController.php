<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Services\ModelProviders\ModelProviderFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ModelProxyController extends Controller
{
    private ModelProviderFactory $providerFactory;

    public function __construct(ModelProviderFactory $providerFactory)
    {
        $this->providerFactory = $providerFactory;
    }

    /**
     * AI Proxy Gateway - Proxy AI API requests
     * Agent-bridge tự build messages, system prompt, context và gửi đến đây
     * Laravel chỉ forward đến AI API và trả về response
     */
    public function chat(Request $request): JsonResponse
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

        try {
            Log::info('[Model Proxy] Backend received AI proxy request', [
                'provider' => $provider,
                'model' => $model,
                'messages_count' => count($messages),
                'has_tools' => !empty($tools)
            ]);

            // Create provider instance
            $modelProvider = $this->providerFactory->create($provider);

            // Proxy request đến AI service - chỉ forward messages, tools, model
            $response = $modelProvider->chat($messages, $tools, $model);

            // Validate response
            if (empty($response) || !is_array($response)) {
                Log::error('[Model Proxy] Invalid response from AI service', ['response' => $response]);
                throw new \Exception('AI service trả về response không hợp lệ');
            }

            Log::info('[Model Proxy] AI response received', [
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

        } catch (\InvalidArgumentException $e) {
            Log::error('[Model Proxy] Invalid provider', [
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Unsupported provider: ' . $provider,
                'content' => 'Xin lỗi, provider không được hỗ trợ: ' . $provider
            ], 400);
        } catch (\Exception $e) {
            Log::error('[Model Proxy] Error proxying AI request', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Lỗi khi proxy AI request: ' . $e->getMessage(),
                'content' => 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. ' . $e->getMessage()
            ], 500);
        }
    }
}

