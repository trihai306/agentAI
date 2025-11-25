<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private ?string $apiKey;
    private string $apiUrl = 'https://generativelanguage.googleapis.com/v1beta';
    private int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $this->timeout = config('services.gemini.timeout', 120);
    }

    /**
     * Chat with Gemini API (supports function calling like OpenAI)
     * Messages đã được build sẵn từ agent-bridge, bao gồm tool_results
     */
    public function chat(array $messages, array $tools = null, ?string $model = null): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('Gemini API key is not configured');
            return [
                'content' => 'Lỗi: Gemini API key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env',
                'tool_calls' => null
            ];
        }

        if (empty($model)) {
            Log::error('Gemini model is required');
            return [
                'content' => 'Lỗi: Model không được chỉ định. Vui lòng chọn model từ UI.',
                'tool_calls' => null
            ];
        }

        try {
            $modelName = $model;
            $url = "{$this->apiUrl}/models/{$modelName}:generateContent?key={$this->apiKey}";

            // Convert messages to Gemini format (messages đã bao gồm tool_results)
            $contents = $this->convertMessagesToGeminiFormat($messages);

            // Validate contents is not empty
            if (empty($contents)) {
                Log::error('Gemini API: Empty contents after conversion', ['messages' => $messages]);
                return [
                    'content' => 'Lỗi: Không thể convert messages sang Gemini format.',
                    'tool_calls' => null
                ];
            }

            $payload = [
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                ],
            ];

            // Add tools if provided (Gemini uses "tools" array)
            // Vẫn gửi tools khi có tool_results để AI có thể tiếp tục gọi tool nếu cần
            // Nếu gặp UNEXPECTED_TOOL_CALL, sẽ retry không có tools
            if ($tools !== null && !empty($tools)) {
                $geminiTools = $this->convertToolsToGeminiFormat($tools);
                if (!empty($geminiTools)) {
                    $payload['tools'] = [
                        [
                            'functionDeclarations' => $geminiTools
                        ]
                    ];
                }
            }

            // Log payload for debugging (only in development)
            if (config('app.debug')) {
                // Log full tools structure for debugging
                $toolsDebug = null;
                if (!empty($payload['tools']) && !empty($payload['tools'][0]['functionDeclarations'])) {
                    $firstTool = $payload['tools'][0]['functionDeclarations'][0] ?? null;
                    if ($firstTool) {
                        $toolsDebug = [
                            'name' => $firstTool['name'] ?? null,
                            'parameters' => $firstTool['parameters'] ?? null
                        ];
                        // Check for indexed array in properties
                        if (isset($toolsDebug['parameters']['properties']) && is_array($toolsDebug['parameters']['properties'])) {
                            $keys = array_keys($toolsDebug['parameters']['properties']);
                            $toolsDebug['properties_is_indexed'] = !empty($keys) && $keys === range(0, count($keys) - 1);
                            $toolsDebug['properties_keys'] = $keys;
                            // Check nested properties
                            foreach ($toolsDebug['parameters']['properties'] as $propKey => $propValue) {
                                if (is_array($propValue) && isset($propValue['properties']) && is_array($propValue['properties'])) {
                                    $nestedKeys = array_keys($propValue['properties']);
                                    if (!empty($nestedKeys) && $nestedKeys === range(0, count($nestedKeys) - 1)) {
                                        $toolsDebug['nested_indexed_properties'] = [
                                            'key' => $propKey,
                                            'properties' => $propValue['properties']
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }

                Log::debug('Gemini API request', [
                    'url' => $url,
                    'payload_size' => strlen(json_encode($payload)),
                    'tools_count' => count($tools ?? []),
                    'messages_count' => count($messages),
                    'tools_debug' => $toolsDebug
                ]);
            }

            // Normalize payload - ensure empty properties are encoded as {} not []
            // Recursively fix empty properties arrays
            $payload = $this->fixEmptyPropertiesInPayload($payload);

            // Use json_encode with custom encoding to ensure empty properties are {}
            $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            // Replace all empty arrays in "properties" fields with empty objects
            $payloadJson = preg_replace('/"properties"\s*:\s*\[\s*\]/', '"properties":{}', $payloadJson);

            Log::info('[GeminiService] Sending request to Gemini API', [
                'payload_size' => strlen($payloadJson),
                'timeout' => $this->timeout
            ]);

            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->withBody($payloadJson, 'application/json')->timeout($this->timeout)->post($url);

                Log::info('[GeminiService] Received response from Gemini API', [
                    'status' => $response->status(),
                    'successful' => $response->successful()
                ]);
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                Log::error('[GeminiService] Connection timeout/error', [
                    'message' => $e->getMessage(),
                    'timeout' => $this->timeout
                ]);
                return [
                    'content' => 'Lỗi: Kết nối tới Gemini API bị timeout. Vui lòng thử lại.',
                    'tool_calls' => null
                ];
            } catch (\Exception $e) {
                Log::error('[GeminiService] Request exception', [
                    'message' => $e->getMessage(),
                    'class' => get_class($e)
                ]);
                return [
                    'content' => 'Lỗi: ' . $e->getMessage(),
                    'tool_calls' => null
                ];
            }

            if ($response->successful()) {
                $data = $response->json();

                // Parse Gemini response
                $candidates = $data['candidates'] ?? [];
                if (empty($candidates)) {
                    Log::warning('Gemini API returned empty candidates', ['data' => $data]);
                    return [
                        'content' => 'Không có response từ Gemini API. Vui lòng thử lại.',
                        'tool_calls' => null
                    ];
                }

                $candidate = $candidates[0];

                // Check for finish reason
                $finishReason = $candidate['finishReason'] ?? null;
                if ($finishReason === 'SAFETY' || $finishReason === 'RECITATION') {
                    Log::warning('Gemini API blocked response', ['finishReason' => $finishReason]);
                    return [
                        'content' => 'Xin lỗi, Gemini API đã chặn response vì lý do an toàn. Vui lòng thử lại với yêu cầu khác.',
                        'tool_calls' => null
                    ];
                }

                // Handle UNEXPECTED_TOOL_CALL - this happens when we send tools with tool messages
                // In this case, we should retry without tools
                if ($finishReason === 'UNEXPECTED_TOOL_CALL') {
                    // Check if we have tool messages (functionResponse) in contents
                    $hasToolMessages = false;
                    foreach ($contents as $content) {
                        foreach ($content['parts'] ?? [] as $part) {
                            if (isset($part['functionResponse'])) {
                                $hasToolMessages = true;
                                break 2;
                            }
                        }
                    }

                    Log::warning('[GeminiService] UNEXPECTED_TOOL_CALL finish reason', [
                        'finishReason' => $finishReason,
                        'has_tool_messages' => $hasToolMessages,
                        'has_tools' => !empty($tools),
                        'payload_has_tools' => isset($payload['tools'])
                    ]);

                    // If we have tool messages, retry without tools
                    if ($hasToolMessages) {
                        Log::info('[GeminiService] Retrying without tools after UNEXPECTED_TOOL_CALL');

                        // Convert functionCall and functionResponse to text format for retry
                        // Gemini API needs tools to understand functionCall/functionResponse, so we convert them to text
                        $retryContents = [];
                        foreach ($contents as $content) {
                            $retryParts = [];
                            foreach ($content['parts'] ?? [] as $part) {
                                if (isset($part['text'])) {
                                    $retryParts[] = ['text' => $part['text']];
                                } elseif (isset($part['functionCall'])) {
                                    // Convert functionCall to text - keep it simple
                                    $funcName = $part['functionCall']['name'] ?? '';
                                    $funcArgs = $part['functionCall']['args'] ?? [];
                                    $argsText = is_array($funcArgs)
                                        ? json_encode($funcArgs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                                        : (string)$funcArgs;
                                    // Don't include functionCall text in retry - it's already in the conversation
                                    // Just skip it to avoid confusion
                                } elseif (isset($part['functionResponse'])) {
                                    // Convert functionResponse to text - make it clear and actionable
                                    $funcName = $part['functionResponse']['name'] ?? '';
                                    $funcResponse = $part['functionResponse']['response'] ?? [];

                                    // Extract text from response
                                    $responseText = '';
                                    if (is_string($funcResponse)) {
                                        $responseText = $funcResponse;
                                    } elseif (is_array($funcResponse)) {
                                        // If it's an object with 'result' key, use that
                                        if (isset($funcResponse['result'])) {
                                            $responseText = is_string($funcResponse['result'])
                                                ? $funcResponse['result']
                                                : json_encode($funcResponse['result'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                                        } else {
                                            $responseText = json_encode($funcResponse, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                                        }
                                    } else {
                                        $responseText = (string)$funcResponse;
                                    }

                                    // Format as a clear result message
                                    $retryParts[] = [
                                        'text' => "Kết quả từ {$funcName}: {$responseText}"
                                    ];
                                }
                            }
                            if (!empty($retryParts)) {
                                $retryContents[] = [
                                    'role' => $content['role'] ?? 'user',
                                    'parts' => $retryParts
                                ];
                            }
                        }

                        $payloadWithoutTools = [
                            'contents' => $retryContents,
                            'generationConfig' => [
                                'temperature' => 0.7,
                            ],
                        ];

                        $payloadJson = json_encode($payloadWithoutTools, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                        $payloadJson = preg_replace('/"properties"\s*:\s*\[\s*\]/', '"properties":{}', $payloadJson);

                        Log::info('[GeminiService] Retry request payload', [
                            'payload_size' => strlen($payloadJson),
                            'has_tools' => false,
                            'contents_count' => count($retryContents),
                            'converted_functionResponse_to_text' => true
                        ]);

                        try {
                            $retryResponse = Http::withHeaders([
                                'Content-Type' => 'application/json',
                            ])->withBody($payloadJson, 'application/json')->timeout($this->timeout)->post($url);

                            Log::info('[GeminiService] Retry response received', [
                                'status' => $retryResponse->status(),
                                'successful' => $retryResponse->successful()
                            ]);

                            if ($retryResponse->successful()) {
                                $retryData = $retryResponse->json();
                                $retryCandidates = $retryData['candidates'] ?? [];

                                Log::info('[GeminiService] Retry response data', [
                                    'has_candidates' => !empty($retryCandidates),
                                    'candidates_count' => count($retryCandidates),
                                    'response_keys' => array_keys($retryData)
                                ]);

                                if (!empty($retryCandidates)) {
                                    $retryCandidate = $retryCandidates[0];
                                    $retryFinishReason = $retryCandidate['finishReason'] ?? null;
                                    $retryContent = $retryCandidate['content'] ?? [];
                                    $retryParts = $retryContent['parts'] ?? [];

                                    Log::info('[GeminiService] Retry candidate parsed', [
                                        'finish_reason' => $retryFinishReason,
                                        'has_content' => !empty($retryContent),
                                        'parts_count' => count($retryParts),
                                        'parts' => $retryParts
                                    ]);

                                    $textContent = '';
                                    $functionCalls = [];

                                    foreach ($retryParts as $part) {
                                        if (isset($part['text'])) {
                                            $textContent .= $part['text'];
                                        }
                                        if (isset($part['functionCall'])) {
                                            $functionCalls[] = $this->convertGeminiFunctionCallToOpenAIFormat($part['functionCall']);
                                        }
                                    }

                                    Log::info('[GeminiService] Retry successful', [
                                        'has_content' => !empty($textContent),
                                        'content_length' => strlen($textContent),
                                        'has_tool_calls' => !empty($functionCalls),
                                        'tool_calls_count' => count($functionCalls)
                                    ]);

                                    // If still no content, check if there's an error or safety block
                                    if (empty($textContent) && empty($functionCalls)) {
                                        Log::warning('[GeminiService] Retry returned empty content', [
                                            'finish_reason' => $retryFinishReason,
                                            'candidate' => $retryCandidate
                                        ]);

                                        if ($retryFinishReason === 'SAFETY' || $retryFinishReason === 'RECITATION') {
                                            return [
                                                'content' => 'Xin lỗi, Gemini API đã chặn response vì lý do an toàn.',
                                                'tool_calls' => null
                                            ];
                                        }

                                        // Try to get error message from promptFeedback
                                        $promptFeedback = $retryData['promptFeedback'] ?? [];
                                        $blockReason = $promptFeedback['blockReason'] ?? null;
                                        if ($blockReason) {
                                            return [
                                                'content' => 'Xin lỗi, response bị chặn: ' . $blockReason,
                                                'tool_calls' => null
                                            ];
                                        }
                                    }

                                    return [
                                        'content' => $textContent ?: null,
                                        'tool_calls' => !empty($functionCalls) ? $functionCalls : null,
                                        'role' => 'assistant',
                                    ];
                                } else {
                                    Log::warning('[GeminiService] Retry response has no candidates', [
                                        'response_data' => $retryData
                                    ]);
                                }
                            } else {
                                Log::error('[GeminiService] Retry failed', [
                                    'status' => $retryResponse->status(),
                                    'body' => substr($retryResponse->body(), 0, 200)
                                ]);
                            }
                        } catch (\Exception $e) {
                            Log::error('[GeminiService] Retry exception', [
                                'message' => $e->getMessage()
                            ]);
                        }
                    }

                    // If retry failed or not applicable, return error
                    Log::error('[GeminiService] UNEXPECTED_TOOL_CALL handling failed', [
                        'has_tool_messages' => $hasToolMessages,
                        'retry_attempted' => $hasToolMessages
                    ]);

                    return [
                        'content' => 'Xin lỗi, có lỗi xảy ra khi xử lý tool results. Vui lòng thử lại.',
                        'tool_calls' => null
                    ];
                }

                $content = $candidate['content'] ?? [];
                $parts = $content['parts'] ?? [];

                $textContent = '';
                $functionCalls = [];

                foreach ($parts as $part) {
                    if (isset($part['text'])) {
                        $textContent .= $part['text'];
                    }
                    if (isset($part['functionCall'])) {
                        $functionCalls[] = $this->convertGeminiFunctionCallToOpenAIFormat($part['functionCall']);
                    }
                }

                // Ensure we always return content, even if empty
                if (empty($textContent) && empty($functionCalls)) {
                    Log::warning('Gemini API returned empty content and no function calls', ['candidate' => $candidate]);
                    return [
                        'content' => 'Xin lỗi, tôi không thể tạo response. Vui lòng thử lại.',
                        'tool_calls' => null
                    ];
                }

                return [
                    'content' => $textContent ?: null,
                    'tool_calls' => !empty($functionCalls) ? $functionCalls : null,
                    'role' => 'assistant',
                ];
            }

            // Parse error response
            $errorBody = [];
            try {
                $errorBody = $response->json();
            } catch (\Exception $e) {
                Log::warning('[GeminiService] Failed to parse error response as JSON', [
                    'body' => $response->body(),
                    'status' => $response->status()
                ]);
                $errorBody = ['error' => $response->body()];
            }

            $errorMessage = $errorBody['error']['message'] ?? $errorBody['error'] ?? $response->body();

            Log::error('[GeminiService] Gemini API error', [
                'status' => $response->status(),
                'error' => $errorMessage,
                'error_code' => $errorBody['error']['code'] ?? null,
                'response_body_preview' => is_string($response->body()) ? substr($response->body(), 0, 200) : 'N/A'
            ]);

            // Provide more helpful error message
            $userMessage = 'Lỗi khi gọi Gemini API';
            if (isset($errorBody['error']['message'])) {
                $userMessage .= ': ' . $errorBody['error']['message'];
            } elseif ($response->status() === 400) {
                $userMessage .= ': Request không hợp lệ. Vui lòng kiểm tra lại format.';
            } elseif ($response->status() === 401) {
                $userMessage .= ': API key không hợp lệ.';
            } elseif ($response->status() === 403) {
                $userMessage .= ': Không có quyền truy cập.';
            } elseif ($response->status() === 429) {
                $userMessage .= ': Quá nhiều requests. Vui lòng thử lại sau.';
            } else {
                $userMessage .= ' (Status: ' . $response->status() . ')';
            }

            return [
                'content' => $userMessage,
                'tool_calls' => null
            ];
        } catch (\Exception $e) {
            Log::error('Gemini API exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'content' => 'Lỗi: ' . $e->getMessage(),
                'tool_calls' => null
            ];
        }
    }

    /**
     * Convert OpenAI-style messages to Gemini format
     * Messages đã được build sẵn từ agent-bridge, bao gồm tool_results
     */
    private function convertMessagesToGeminiFormat(array $messages): array
    {
        $contents = [];
        $systemMessage = null;

        // First, extract system message
        foreach ($messages as $message) {
            if (($message['role'] ?? '') === 'system' && !empty($message['content'])) {
                $systemMessage = $message['content'];
                break;
            }
        }

        // Process messages - messages đã bao gồm tool_results
        foreach ($messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';
            $toolCalls = $message['tool_calls'] ?? null;
            $toolCallId = $message['tool_call_id'] ?? null;

            // Skip system messages (we already extracted it)
            if ($role === 'system') {
                continue;
            }

            $parts = [];

            // Add text content
            if (!empty($content)) {
                // Check if content is array (vision format) or string
                if (is_array($content)) {
                    // OpenAI vision format: [{ type: "text", text: "..." }, { type: "image_url", ... }]
                    foreach ($content as $item) {
                        if ($item['type'] === 'text' && isset($item['text'])) {
                            $parts[] = ['text' => $item['text']];
                        } elseif ($item['type'] === 'image_url' && isset($item['image_url']['url'])) {
                            // Convert to Gemini inlineData format
                            $imageUrl = $item['image_url']['url'];
                            if (strpos($imageUrl, 'data:image') === 0) {
                                $imageParts = explode(',', $imageUrl, 2);
                                if (count($imageParts) === 2) {
                                    $parts[] = [
                                        'inlineData' => [
                                            'mimeType' => 'image/png',
                                            'data' => $imageParts[1] // base64 without data URL prefix
                                        ]
                                    ];
                                }
                            }
                        }
                    }
                } else {
                    $parts[] = ['text' => $content];
                }
            }

            // Add function call (tool call from assistant)
            if ($role === 'assistant' && $toolCalls) {
                foreach ($toolCalls as $toolCall) {
                    $functionName = $toolCall['function']['name'] ?? $toolCall['name'] ?? '';
                    $functionArgs = $toolCall['function']['arguments'] ?? $toolCall['arguments'] ?? '{}';

                    // Parse arguments
                    $args = [];
                    if (is_string($functionArgs)) {
                        $args = json_decode($functionArgs, true) ?? [];
                    } elseif (is_array($functionArgs)) {
                        $args = $functionArgs;
                    }

                    $parts[] = [
                        'functionCall' => [
                            'name' => $functionName,
                            'args' => $args
                        ]
                    ];
                }
            }

            // Add function response (tool result) - handle vision format
            if ($role === 'tool' && $toolCallId) {
                $functionName = $message['name'] ?? '';
                $responseData = [];
                $hasImage = false;
                $imageData = null;
                $textParts = [];

                if (is_string($content)) {
                    $parsed = json_decode($content, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $responseData = ['result' => $content];
                    } else {
                        // Check if it's OpenAI vision format
                        if (is_array($parsed) && isset($parsed[0]['type'])) {
                            foreach ($parsed as $item) {
                                if ($item['type'] === 'text' && isset($item['text'])) {
                                    $textParts[] = $item['text'];
                                } elseif ($item['type'] === 'image_url' && isset($item['image_url']['url'])) {
                                    $imageUrl = $item['image_url']['url'];
                                    if (strpos($imageUrl, 'data:image') === 0) {
                                        $hasImage = true;
                                        $imageParts = explode(',', $imageUrl, 2);
                                        if (count($imageParts) === 2) {
                                            $imageData = $imageParts[1];
                                        }
                                    }
                                }
                            }
                            $responseData = ['result' => implode("\n", $textParts) ?: 'Screenshot captured'];
                        } else {
                            $responseData = $parsed;
                        }
                    }
                } elseif (is_array($content)) {
                    // Check if it's OpenAI vision format
                    if (isset($content[0]['type'])) {
                        foreach ($content as $item) {
                            if ($item['type'] === 'text' && isset($item['text'])) {
                                $textParts[] = $item['text'];
                            } elseif ($item['type'] === 'image_url' && isset($item['image_url']['url'])) {
                                $imageUrl = $item['image_url']['url'];
                                if (strpos($imageUrl, 'data:image') === 0) {
                                    $hasImage = true;
                                    $imageParts = explode(',', $imageUrl, 2);
                                    if (count($imageParts) === 2) {
                                        $imageData = $imageParts[1];
                                    }
                                }
                            }
                        }
                        $responseData = ['result' => implode("\n", $textParts) ?: 'Screenshot captured'];
                    } else {
                        $responseData = $content;
                    }
                } else {
                    $responseData = ['result' => $content];
                }

                // Build parts with image if available
                if ($hasImage && $imageData) {
                    $parts[] = [
                        'inlineData' => [
                            'mimeType' => 'image/png',
                            'data' => $imageData
                        ]
                    ];
                }

                $parts[] = [
                    'functionResponse' => [
                        'name' => $functionName,
                        'response' => $responseData
                    ]
                ];
            }

            if (!empty($parts)) {
                $geminiRole = $role === 'assistant' ? 'model' : 'user';
                $contents[] = [
                    'role' => $geminiRole,
                    'parts' => $parts
                ];
            }
        }

        // Add system message to first user message if exists
        if ($systemMessage && !empty($contents)) {
            // Find first user message
            foreach ($contents as &$content) {
                if ($content['role'] === 'user' && !empty($content['parts'])) {
                    // Prepend system message to first user message
                    array_unshift($content['parts'], ['text' => $systemMessage . "\n\n"]);
                    break;
                }
            }
            unset($content); // Unset reference
        }

        return $contents;
    }

    /**
     * Fix empty properties arrays in payload - convert [] to {} for properties fields
     */
    private function fixEmptyPropertiesInPayload($data)
    {
        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $value) {
                if ($key === 'properties' && is_array($value) && empty($value)) {
                    // Convert empty array to empty object using stdClass
                    // This will be encoded as {} in JSON
                    $result[$key] = new \stdClass();
                } elseif (is_array($value) || $value instanceof \stdClass) {
                    $result[$key] = $this->fixEmptyPropertiesInPayload($value);
                } else {
                    $result[$key] = $value;
                }
            }
            return $result;
        } elseif ($data instanceof \stdClass) {
            // Convert stdClass to array and process
            $arr = (array) $data;
            if (empty($arr)) {
                return new \stdClass(); // Keep as empty object
            }
            return $this->fixEmptyPropertiesInPayload($arr);
        }
        return $data;
    }

    /**
     * Check if array is indexed (list) or associative (object)
     */
    private function isIndexedArray(array $arr): bool
    {
        if (empty($arr)) {
            return false; // Empty array can be treated as object
        }
        $keys = array_keys($arr);
        return $keys === range(0, count($keys) - 1);
    }

    /**
     * Clean schema to remove fields not supported by Gemini API
     */
    private function cleanSchemaForGemini(array $schema): array
    {
        $cleaned = [];

        // Fields to keep
        $allowedFields = ['type', 'properties', 'required', 'description', 'enum', 'items'];

        foreach ($schema as $key => $value) {
            // Skip unsupported fields
            if (in_array($key, ['additionalProperties', '$schema', '$ref', 'definitions', 'allOf', 'anyOf', 'oneOf'])) {
                continue;
            }

            // Only keep allowed fields
            if (in_array($key, $allowedFields)) {
                if ($key === 'properties' && is_array($value)) {
                    // Check if properties is an indexed array (list) instead of associative array (object)
                    if ($this->isIndexedArray($value)) {
                        // If properties is an array, convert to empty object
                        // This should not happen, but handle it gracefully
                        Log::warning('GeminiService: properties is indexed array, converting to empty object', [
                            'properties' => $value
                        ]);
                        $cleaned['properties'] = new \stdClass(); // Use stdClass to ensure JSON encodes as {}
                    } else {
                        // Clean nested properties recursively
                        $cleanedProperties = [];
                        foreach ($value as $propKey => $propValue) {
                            // Ensure propKey is a string (property name)
                            if (is_string($propKey)) {
                                if (is_array($propValue)) {
                                    // Recursively clean nested property schema
                                    $cleanedProp = $this->cleanSchemaForGemini($propValue);
                                    // Ensure nested properties is object, not array
                                    if (isset($cleanedProp['properties']) && is_array($cleanedProp['properties'])) {
                                        if ($this->isIndexedArray($cleanedProp['properties']) || empty($cleanedProp['properties'])) {
                                            $cleanedProp['properties'] = new \stdClass();
                                        }
                                    }
                                    $cleanedProperties[$propKey] = $cleanedProp;
                                } else {
                                    $cleanedProperties[$propKey] = $propValue;
                                }
                            } else {
                                // Skip non-string keys (should not happen)
                                Log::warning('GeminiService: Skipping non-string property key', [
                                    'key' => $propKey,
                                    'type' => gettype($propKey)
                                ]);
                            }
                        }
                        // If properties is empty, use stdClass to ensure JSON encodes as {}
                        $cleaned['properties'] = empty($cleanedProperties) ? new \stdClass() : $cleanedProperties;
                    }
                } elseif ($key === 'items' && is_array($value)) {
                    // Clean items schema recursively
                    $cleaned['items'] = $this->cleanSchemaForGemini($value);
                } else {
                    $cleaned[$key] = $value;
                }
            }
        }

        return $cleaned;
    }

    /**
     * Convert OpenAI tools format to Gemini format
     */
    private function convertToolsToGeminiFormat(array $tools): array
    {
        $functionDeclarations = [];

        foreach ($tools as $tool) {
            if (isset($tool['type']) && $tool['type'] === 'function' && isset($tool['function'])) {
                $function = $tool['function'];

                // Get parameters schema
                $inputSchema = $function['parameters'] ?? [];

                // Ensure parameters has correct structure
                $parameters = [];
                if (isset($inputSchema['type']) && isset($inputSchema['properties'])) {
                    // Full schema already has type and properties
                    // But we need to validate properties is not an indexed array
                    $props = $inputSchema['properties'];
                    if (is_array($props)) {
                        if ($this->isIndexedArray($props) || empty($props)) {
                            if ($this->isIndexedArray($props)) {
                                Log::warning('GeminiService: inputSchema properties is indexed array in full schema', [
                                    'properties' => $props
                                ]);
                            }
                            $inputSchema['properties'] = new \stdClass();
                        }
                    } else {
                        $inputSchema['properties'] = new \stdClass();
                    }
                    $parameters = $inputSchema;
                } elseif (isset($inputSchema['properties'])) {
                    // Only properties, need to wrap it
                    // Ensure properties is an object, not array
                    $props = $inputSchema['properties'];
                    if (is_array($props)) {
                        if ($this->isIndexedArray($props) || empty($props)) {
                            if ($this->isIndexedArray($props)) {
                                Log::warning('GeminiService: inputSchema properties is indexed array', [
                                    'properties' => $props
                                ]);
                            }
                            $props = new \stdClass(); // Convert to stdClass to ensure JSON encodes as {}
                        }
                    } else {
                        $props = new \stdClass();
                    }

                    $parameters = [
                        'type' => 'object',
                        'properties' => $props,
                        'required' => $inputSchema['required'] ?? []
                    ];
                } else {
                    // Empty schema
                    $parameters = [
                        'type' => 'object',
                        'properties' => new \stdClass(),
                        'required' => []
                    ];
                }

                // Clean schema to remove unsupported fields
                $parameters = $this->cleanSchemaForGemini($parameters);

                // Ensure properties is an object (associative array), not indexed array
                if (!isset($parameters['properties']) || (!is_array($parameters['properties']) && !($parameters['properties'] instanceof \stdClass))) {
                    $parameters['properties'] = new \stdClass();
                } elseif (is_array($parameters['properties'])) {
                    // Double-check: ensure properties is not an indexed array
                    if ($this->isIndexedArray($parameters['properties']) || empty($parameters['properties'])) {
                        if ($this->isIndexedArray($parameters['properties'])) {
                            Log::warning('GeminiService: properties is indexed array after clean, converting to empty', [
                                'properties' => $parameters['properties']
                            ]);
                        }
                        $parameters['properties'] = new \stdClass();
                    }
                }

                // Validate required fields are in properties
                if (isset($parameters['required']) && is_array($parameters['required'])) {
                    $properties = $parameters['properties'] ?? [];
                    $parameters['required'] = array_values(array_filter($parameters['required'], function($req) use ($properties) {
                        return isset($properties[$req]);
                    }));
                }

                $functionDeclarations[] = [
                    'name' => $function['name'] ?? '',
                    'description' => $function['description'] ?? '',
                    'parameters' => $parameters
                ];
            }
        }

        return $functionDeclarations;
    }

    /**
     * Convert Gemini function call to OpenAI format
     */
    private function convertGeminiFunctionCallToOpenAIFormat(array $functionCall): array
    {
        return [
            'id' => 'call_' . uniqid(),
            'type' => 'function',
            'function' => [
                'name' => $functionCall['name'] ?? '',
                'arguments' => json_encode($functionCall['args'] ?? [])
            ]
        ];
    }

    /**
     * Generate MCP tools definition for Gemini function calling
     */
    public function generateMcpToolsDefinition(array $mcpTools): array
    {
        $tools = [];

        foreach ($mcpTools as $tool) {
            $name = $tool['name'] ?? '';
            $description = $tool['description'] ?? '';
            $inputSchema = $tool['inputSchema'] ?? [];

            // Map MCP tools to Gemini function format
            // Use full inputSchema if it has type, properties, required
            // Otherwise, use properties only and wrap it
            $parameters = [];
            if (isset($inputSchema['type']) && isset($inputSchema['properties'])) {
                // Full schema already has type and properties
                // But we need to validate properties is not an indexed array
                $props = $inputSchema['properties'];
                if (is_array($props) && $this->isIndexedArray($props)) {
                    Log::warning('GeminiService: generateMcpToolsDefinition inputSchema properties is indexed array in full schema', [
                        'properties' => $props
                    ]);
                    $inputSchema['properties'] = [];
                }
                $parameters = $inputSchema;
            } elseif (isset($inputSchema['properties'])) {
                // Only properties, need to wrap it
                // Ensure properties is an object, not array
                $props = $inputSchema['properties'];
                if (is_array($props)) {
                    if ($this->isIndexedArray($props) || empty($props)) {
                        if ($this->isIndexedArray($props)) {
                            Log::warning('GeminiService: generateMcpToolsDefinition properties is indexed array', [
                                'properties' => $props
                            ]);
                        }
                        $props = new \stdClass(); // Convert to stdClass to ensure JSON encodes as {}
                    }
                } else {
                    $props = new \stdClass();
                }

                $parameters = [
                    'type' => 'object',
                    'properties' => $props,
                    'required' => $inputSchema['required'] ?? []
                ];
            } else {
                // Empty schema
                $parameters = [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                    'required' => []
                ];
            }

            // Clean schema to remove unsupported fields
            $parameters = $this->cleanSchemaForGemini($parameters);

            // Ensure properties is an object (associative array), not indexed array
            if (!isset($parameters['properties']) || (!is_array($parameters['properties']) && !($parameters['properties'] instanceof \stdClass))) {
                $parameters['properties'] = new \stdClass(); // Use stdClass to ensure JSON encodes as {}
            } elseif (is_array($parameters['properties'])) {
                // Double-check: ensure properties is not an indexed array
                if ($this->isIndexedArray($parameters['properties']) || empty($parameters['properties'])) {
                    if ($this->isIndexedArray($parameters['properties'])) {
                        Log::warning('GeminiService: generateMcpToolsDefinition properties is indexed array after clean', [
                            'properties' => $parameters['properties']
                        ]);
                    }
                    $parameters['properties'] = new \stdClass(); // Use stdClass to ensure JSON encodes as {}
                }
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
}
