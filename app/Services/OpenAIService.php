<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    private ?string $apiKey;
    private string $apiUrl = 'https://api.openai.com/v1/chat/completions';
    private int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key') ?: env('OPENAI_API_KEY');
        $this->timeout = config('services.openai.timeout', 120);
    }

    public function chat(array $messages, array $tools = null, ?string $model = null): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('OpenAI API key is not configured');
            return [
                'content' => 'Lỗi: OpenAI API key chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY vào file .env',
                'tool_calls' => null
            ];
        }

        if (empty($model)) {
            Log::error('OpenAI model is required');
            return [
                'content' => 'Lỗi: Model không được chỉ định. Vui lòng chọn model từ UI.',
                'tool_calls' => null
            ];
        }

        try {
            // Process messages: convert tool message content từ JSON string sang array nếu là screenshot
            $processedMessages = $this->processMessagesForVision($messages);

            $payload = [
                'model' => $model,
                'messages' => $processedMessages,
                'temperature' => 0.7,
            ];

            // Add tools if provided
            if ($tools !== null && !empty($tools)) {
                $payload['tools'] = $tools;
                $payload['tool_choice'] = 'auto';
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout($this->timeout)->post($this->apiUrl, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $choices = $data['choices'] ?? [];

                if (empty($choices)) {
                    Log::warning('OpenAI API returned empty choices', ['data' => $data]);
                    return [
                        'content' => 'Không có response từ OpenAI API. Vui lòng thử lại.',
                        'tool_calls' => null
                    ];
                }

                $message = $choices[0]['message'] ?? [];

                // Ensure we always return content
                if (empty($message['content']) && empty($message['tool_calls'])) {
                    Log::warning('OpenAI API returned empty content and no tool calls', ['message' => $message]);
                    return [
                        'content' => 'Xin lỗi, tôi không thể tạo response. Vui lòng thử lại.',
                        'tool_calls' => null
                    ];
                }

                return [
                    'content' => $message['content'] ?? null,
                    'tool_calls' => $message['tool_calls'] ?? null,
                    'role' => $message['role'] ?? 'assistant',
                ];
            }

            Log::error('OpenAI API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'content' => 'Lỗi khi gọi OpenAI API: ' . $response->status(),
                'tool_calls' => null
            ];
        } catch (\Exception $e) {
            Log::error('OpenAI API exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'content' => 'Lỗi: ' . $e->getMessage(),
                'tool_calls' => null
            ];
        }
    }

    /**
     * Generate MCP tools definition for OpenAI function calling
     */
    public function generateMcpToolsDefinition(array $mcpTools): array
    {
        $tools = [];

        foreach ($mcpTools as $tool) {
            $name = $tool['name'] ?? '';
            $description = $tool['description'] ?? '';
            $inputSchema = $tool['inputSchema'] ?? [];

            // Map MCP tools to OpenAI function format
            // Use full inputSchema if it has type and properties
            // Otherwise, use properties only and wrap it
            $parameters = [];
            if (isset($inputSchema['type']) && isset($inputSchema['properties'])) {
                // Full schema already has type and properties
                $parameters = $inputSchema;
            } elseif (isset($inputSchema['properties'])) {
                // Only properties, need to wrap it
                $parameters = [
                    'type' => 'object',
                    'properties' => $inputSchema['properties'],
                    'required' => $inputSchema['required'] ?? []
                ];
            } else {
                // Empty schema
                $parameters = [
                    'type' => 'object',
                    'properties' => [],
                    'required' => []
                ];
            }

            $function = [
                'type' => 'function',
                'function' => [
                    'name' => $name,
                    'description' => $description,
                    'parameters' => $parameters
                ]
            ];

            $tools[] = $function;
        }

        return $tools;
    }

    /**
     * Process messages để convert screenshot content từ JSON string sang OpenAI vision format
     */
    private function processMessagesForVision(array $messages): array
    {
        $processed = [];

        foreach ($messages as $message) {
            // Nếu là tool message và có content là JSON string (có thể là screenshot)
            if (isset($message['role']) && $message['role'] === 'tool' && isset($message['content'])) {
                $content = $message['content'];

                // Try to parse content as JSON
                if (is_string($content)) {
                    $decoded = json_decode($content, true);

                    // Nếu là array với image_url format (OpenAI vision format)
                    if (is_array($decoded) && isset($decoded[0]['type']) && $decoded[0]['type'] === 'text') {
                        // Đã là vision format, giữ nguyên
                        $message['content'] = $decoded;
                    } else {
                        // Giữ nguyên string content
                        $message['content'] = $content;
                    }
                }
            }

            $processed[] = $message;
        }

        return $processed;
    }
}

