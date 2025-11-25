<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeService
{
    private ?string $apiKey;
    private string $apiUrl = 'https://api.anthropic.com/v1/messages';
    private int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.claude.api_key') ?: env('ANTHROPIC_API_KEY');
        $this->timeout = config('services.claude.timeout', 120);
    }

    /**
     * Chat with Claude API (supports function calling like OpenAI)
     */
    public function chat(array $messages, array $tools = null, ?string $model = null): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('Claude API key is not configured');
            return [
                'content' => 'Lỗi: Claude API key chưa được cấu hình. Vui lòng thêm ANTHROPIC_API_KEY vào file .env',
                'tool_calls' => null
            ];
        }

        if (empty($model)) {
            Log::error('Claude model is required');
            return [
                'content' => 'Lỗi: Model không được chỉ định. Vui lòng chọn model từ UI.',
                'tool_calls' => null
            ];
        }

        try {
            $modelName = $model;

            // Convert messages format for Claude
            $claudeMessages = $this->convertMessagesForClaude($messages);

            $payload = [
                'model' => $modelName,
                'max_tokens' => 4096,
                'messages' => $claudeMessages,
            ];

            // Add tools if provided
            if (!empty($tools)) {
                $payload['tools'] = $this->convertToolsForClaude($tools);
            }

            Log::info('[Claude] Sending request', [
                'model' => $modelName,
                'messages_count' => count($claudeMessages),
                'tools_count' => count($tools ?? [])
            ]);

            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ])
                ->timeout($this->timeout)
                ->post($this->apiUrl, $payload);

            if (!$response->successful()) {
                Log::error('[Claude] API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [
                    'content' => 'Lỗi khi gọi Claude API: ' . $response->status(),
                    'tool_calls' => null
                ];
            }

            $responseData = $response->json();
            Log::info('[Claude] Response received', [
                'has_content' => !empty($responseData['content']),
                'stop_reason' => $responseData['stop_reason'] ?? null
            ]);

            // Parse Claude response
            $content = '';
            $toolCalls = [];

            foreach ($responseData['content'] ?? [] as $block) {
                if ($block['type'] === 'text') {
                    $content .= $block['text'];
                } elseif ($block['type'] === 'tool_use') {
                    $toolCalls[] = [
                        'id' => $block['id'],
                        'type' => 'function',
                        'function' => [
                            'name' => $block['name'],
                            'arguments' => json_encode($block['input'] ?? [])
                        ]
                    ];
                }
            }

            return [
                'content' => $content,
                'tool_calls' => !empty($toolCalls) ? $toolCalls : null
            ];

        } catch (\Exception $e) {
            Log::error('[Claude] Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'content' => 'Lỗi khi xử lý Claude API: ' . $e->getMessage(),
                'tool_calls' => null
            ];
        }
    }

    /**
     * Convert messages format for Claude
     */
    private function convertMessagesForClaude(array $messages): array
    {
        $claudeMessages = [];

        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                // Claude doesn't support system role directly, prepend to first user message
                continue;
            }

            $claudeMsg = [
                'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
            ];

            // Handle tool calls in assistant messages
            if ($msg['role'] === 'assistant' && !empty($msg['tool_calls'])) {
                $content = [];
                if (!empty($msg['content'])) {
                    $content[] = ['type' => 'text', 'text' => $msg['content']];
                }
                foreach ($msg['tool_calls'] as $toolCall) {
                    $content[] = [
                        'type' => 'tool_use',
                        'id' => $toolCall['id'] ?? uniqid('tool_'),
                        'name' => $toolCall['function']['name'],
                        'input' => json_decode($toolCall['function']['arguments'], true) ?? []
                    ];
                }
                $claudeMsg['content'] = $content;
            } elseif ($msg['role'] === 'user' && !empty($msg['content'])) {
                // Handle vision format (screenshot) - convert OpenAI format to Claude format
                $content = $msg['content'];
                if (is_array($content)) {
                    // OpenAI vision format: [{ type: "text", text: "..." }, { type: "image_url", ... }]
                    $claudeContent = [];
                    foreach ($content as $item) {
                        if ($item['type'] === 'text' && isset($item['text'])) {
                            $claudeContent[] = ['type' => 'text', 'text' => $item['text']];
                        } elseif ($item['type'] === 'image_url' && isset($item['image_url']['url'])) {
                            // Convert to Claude image format
                            $imageUrl = $item['image_url']['url'];
                            if (strpos($imageUrl, 'data:image') === 0) {
                                $imageParts = explode(',', $imageUrl, 2);
                                if (count($imageParts) === 2) {
                                    // Extract media type from data URL
                                    $mediaType = 'image/png';
                                    if (preg_match('/data:image\/([^;]+)/', $imageUrl, $matches)) {
                                        $mediaType = 'image/' . $matches[1];
                                    }
                                    $claudeContent[] = [
                                        'type' => 'image',
                                        'source' => [
                                            'type' => 'base64',
                                            'media_type' => $mediaType,
                                            'data' => $imageParts[1] // base64 without data URL prefix
                                        ]
                                    ];
                                }
                            }
                        }
                    }
                    $claudeMsg['content'] = $claudeContent;
                } else {
                    $claudeMsg['content'] = $content;
                }
            } elseif ($msg['role'] === 'tool' && !empty($msg['content'])) {
                // Handle tool messages - convert vision format if needed
                $content = $msg['content'];
                if (is_array($content)) {
                    // OpenAI vision format in tool message
                    $claudeContent = [];
                    foreach ($content as $item) {
                        if ($item['type'] === 'text' && isset($item['text'])) {
                            $claudeContent[] = ['type' => 'text', 'text' => $item['text']];
                        } elseif ($item['type'] === 'image_url' && isset($item['image_url']['url'])) {
                            $imageUrl = $item['image_url']['url'];
                            if (strpos($imageUrl, 'data:image') === 0) {
                                $imageParts = explode(',', $imageUrl, 2);
                                if (count($imageParts) === 2) {
                                    $mediaType = 'image/png';
                                    if (preg_match('/data:image\/([^;]+)/', $imageUrl, $matches)) {
                                        $mediaType = 'image/' . $matches[1];
                                    }
                                    $claudeContent[] = [
                                        'type' => 'image',
                                        'source' => [
                                            'type' => 'base64',
                                            'media_type' => $mediaType,
                                            'data' => $imageParts[1]
                                        ]
                                    ];
                                }
                            }
                        }
                    }
                    // Claude doesn't have tool role, convert to user message with content
                    $claudeMsg['role'] = 'user';
                    $claudeMsg['content'] = $claudeContent;
                } else {
                    // Tool message as text - Claude doesn't support tool role, skip or convert
                    // Skip tool messages for now as Claude handles tool results differently
                    continue;
                }
            } elseif ($msg['role'] === 'assistant' && !empty($msg['content'])) {
                $claudeMsg['content'] = $msg['content'];
            } else {
                continue;
            }

            $claudeMessages[] = $claudeMsg;
        }

        // Prepend system message to first user message if exists
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system' && !empty($msg['content'])) {
                if (!empty($claudeMessages) && $claudeMessages[0]['role'] === 'user') {
                    $claudeMessages[0]['content'] = $msg['content'] . "\n\n" . $claudeMessages[0]['content'];
                }
                break;
            }
        }

        return $claudeMessages;
    }

    /**
     * Convert tools format for Claude
     */
    private function convertToolsForClaude(array $tools): array
    {
        $claudeTools = [];

        foreach ($tools as $tool) {
            $claudeTools[] = [
                'name' => $tool['function']['name'],
                'description' => $tool['function']['description'] ?? '',
                'input_schema' => $tool['function']['parameters'] ?? []
            ];
        }

        return $claudeTools;
    }

    /**
     * Generate MCP tools definition for Claude
     */
    public function generateMcpToolsDefinition(array $mcpTools): array
    {
        $tools = [];

        foreach ($mcpTools as $tool) {
            $tools[] = [
                'type' => 'function',
                'function' => [
                    'name' => $tool['name'] ?? '',
                    'description' => $tool['description'] ?? '',
                    'parameters' => $tool['inputSchema'] ?? []
                ]
            ];
        }

        return $tools;
    }
}

