<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\Message;
use App\Services\OpenAIService;
use App\Http\Controllers\AIController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function __construct(
        private OpenAIService $openAIService,
        private AIController $aiController
    ) {}

    protected function sessionQuery()
    {
        $query = ChatSession::query();

        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            $query->whereNull('user_id');
        }

        return $query;
    }

    protected function ensureSessionOwnership(ChatSession $chatSession): void
    {
        if (Auth::check()) {
            abort_if($chatSession->user_id !== Auth::id(), 403);
        } else {
            abort_if($chatSession->user_id !== null, 403);
        }
    }

    protected function formatMessage(Message $msg): array
    {
            // Ensure tool_calls have proper metadata (status, duration, timestamp)
            $toolCalls = $msg->tool_calls;
            if (is_array($toolCalls)) {
                $toolCalls = array_map(function ($tc) {
                    // Ensure status is set based on result/error
                    if (!isset($tc['status'])) {
                        $tc['status'] = isset($tc['error']) ? 'error' : (isset($tc['result']) ? 'completed' : 'pending');
                    }
                    // Ensure timestamp if not set
                    if (!isset($tc['timestamp']) && isset($tc['created_at'])) {
                        $tc['timestamp'] = $tc['created_at'];
                    }
                    return $tc;
                }, $toolCalls);
            }

            return [
                'id' => $msg->id,
                'content' => $msg->content,
                'role' => $msg->role,
                'tool_calls' => $toolCalls,
                'iterations' => $msg->iterations,
                'device_id' => $msg->device_id,
                'metadata' => $msg->metadata ?? [],
                'created_at' => $msg->created_at?->toISOString(),
            ];
    }

    protected function formatSession(ChatSession $session): array
    {
        return [
            'id' => $session->id,
            'session_id' => $session->session_id,
            'name' => $session->name,
            'device_id' => $session->device_id,
            'provider' => $session->provider,
            'model' => $session->model,
            'last_message_at' => $session->last_message_at?->toISOString(),
            'created_at' => $session->created_at?->toISOString(),
            'updated_at' => $session->updated_at?->toISOString(),
        ];
    }

    protected function createSessionRecord(array $attributes = []): ChatSession
    {
        $sessionId = $attributes['session_id'] ?? (string) Str::uuid();

        $session = ChatSession::create([
            'session_id' => $sessionId,
            'name' => $attributes['name'] ?? 'Session ' . now()->format('H:i'),
            'user_id' => Auth::check() ? Auth::id() : null,
            'device_id' => $attributes['device_id'] ?? null,
            'provider' => $attributes['provider'] ?? null,
            'model' => $attributes['model'] ?? null,
            'metadata' => $attributes['metadata'] ?? null,
        ]);

        return $session;
    }

    protected function updateSessionMetadata(ChatSession $chatSession, array $attributes = []): ChatSession
    {
        $dirty = false;

        foreach (['name', 'device_id', 'provider', 'model'] as $field) {
            if (!empty($attributes[$field]) && $chatSession->{$field} !== $attributes[$field]) {
                $chatSession->{$field} = $attributes[$field];
                $dirty = true;
            }
        }

        if (!empty($attributes['metadata'])) {
            $chatSession->metadata = array_merge($chatSession->metadata ?? [], $attributes['metadata']);
            $dirty = true;
        }

        if (!empty($attributes['last_message_at'])) {
            $chatSession->last_message_at = $attributes['last_message_at'];
            $dirty = true;
        }

        if ($dirty) {
            $chatSession->save();
        }

        return $chatSession;
    }

    protected function getOrCreateSession(?string $sessionId, array $attributes = []): ChatSession
    {
        $chatSession = null;

        if ($sessionId) {
            $chatSession = (clone $this->sessionQuery())
                ->where('session_id', $sessionId)
                ->first();
        }

        if (!$chatSession) {
            $chatSession = $this->createSessionRecord(array_merge($attributes, [
                'session_id' => $sessionId ?? (string) Str::uuid(),
            ]));
        } else {
            $chatSession = $this->updateSessionMetadata($chatSession, $attributes);
        }

        return $chatSession;
    }

    protected function resolveActiveSession($sessions, ?string $requestedSessionId): ?ChatSession
    {
        if ($requestedSessionId) {
            $session = $sessions->firstWhere('session_id', $requestedSessionId);
            if ($session) {
                return $session;
            }
        }

        return $sessions->first();
    }

    public function index(Request $request): Response
    {
        Log::info('[ChatController::index] Start', [
            'query_params' => $request->query(),
            'user_id' => Auth::id(),
        ]);

        $sessions = $this->sessionQuery()
            ->orderByDesc('updated_at')
            ->get();

        Log::info('[ChatController::index] Sessions found', [
            'count' => $sessions->count(),
            'session_ids' => $sessions->pluck('session_id')->toArray(),
        ]);

        if ($sessions->isEmpty()) {
            $sessions->push($this->createSessionRecord());
            Log::info('[ChatController::index] Created new session (no sessions found)');
        }

        // Get session_id from query parameter (preserved in URL on refresh)
        $requestedSessionId = $request->query('session_id');

        Log::info('[ChatController::index] Requested session_id', [
            'requested_session_id' => $requestedSessionId,
        ]);

        // Also check for session_id in localStorage via JavaScript (fallback)
        // But primarily use query parameter for reliability

        $activeSession = $this->resolveActiveSession($sessions, $requestedSessionId);

        // If no active session found but we have a requested session_id, try to find it
        if (!$activeSession && $requestedSessionId) {
            Log::info('[ChatController::index] Active session not found in sessions list, searching in DB', [
                'requested_session_id' => $requestedSessionId,
            ]);
            $activeSession = (clone $this->sessionQuery())
                ->where('session_id', $requestedSessionId)
                ->first();

            if ($activeSession) {
                Log::info('[ChatController::index] Found session in DB', [
                    'session_id' => $activeSession->session_id,
                    'session_id_in_db' => $activeSession->id,
                ]);
            } else {
                Log::warning('[ChatController::index] Session not found in DB', [
                    'requested_session_id' => $requestedSessionId,
                ]);
            }
        }

        // If still no session, use first one or create new
        if (!$activeSession) {
            Log::info('[ChatController::index] No active session, using first or creating new');
            $activeSession = $sessions->first();
            if (!$activeSession) {
                $activeSession = $this->createSessionRecord();
                $sessions->push($activeSession);
                Log::info('[ChatController::index] Created new session');
            }
        }

        Log::info('[ChatController::index] Active session determined', [
            'session_id' => $activeSession->session_id,
            'session_db_id' => $activeSession->id,
        ]);

        // Load messages for active session
        $messages = $activeSession
            ? $activeSession->messages()->orderBy('created_at')->get()->map(fn ($msg) => $this->formatMessage($msg))
            : collect();

        Log::info('[ChatController::index] Messages loaded', [
            'session_id' => $activeSession->session_id,
            'messages_count' => $messages->count(),
            'message_ids' => $messages->pluck('id')->toArray(),
        ]);

        return Inertia::render('Chat', [
            'messages' => $messages,
            'sessions' => $sessions->map(fn ($session) => $this->formatSession($session)),
            'activeSession' => $activeSession ? $this->formatSession($activeSession) : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'device_id' => 'nullable|string', // Device ID từ phone viewer
            'model' => 'nullable|string', // Model selection
            'provider' => 'nullable|string', // Provider: openai, gemini, claude
        ]);

        // Lưu message của user
        $userMessage = Message::create([
            'content' => $request->input('content'),
            'role' => 'user',
            'user_id' => Auth::check() ? Auth::id() : null,
        ]);

        // Frontend sẽ tự gọi agent-bridge trực tiếp (port 3001, 3002)
        // Backend chỉ lưu messages vào database
        // Fallback: Nếu frontend không gọi agent-bridge, dùng simple chat
        try {
            $recentMessages = Message::orderBy('created_at', 'desc')->take(10)->get()->reverse()->values();
            $messagesForAI = $recentMessages->map(function ($msg) {
                return [
                    'role' => $msg->role,
                    'content' => $msg->content,
                ];
            })->toArray();

            $aiResponse = $this->openAIService->chat($messagesForAI);
            $responseContent = is_array($aiResponse)
                ? ($aiResponse['content'] ?? 'Xin lỗi, tôi không thể phản hồi lúc này.')
                : (is_string($aiResponse) ? $aiResponse : 'Xin lỗi, tôi không thể phản hồi lúc này.');
        } catch (\Exception $e) {
            $responseContent = 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.';
        }

        // Lưu response của AI
        $assistantMessage = Message::create([
            'content' => $responseContent,
            'role' => 'assistant',
            'user_id' => Auth::check() ? Auth::id() : null,
        ]);

        return response()->json([
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id');

        $query = Message::orderBy('created_at', 'asc');

        if ($sessionId) {
            $chatSession = (clone $this->sessionQuery())
                ->where('session_id', $sessionId)
                ->firstOrFail();

            $this->ensureSessionOwnership($chatSession);
            $query->where('chat_session_id', $chatSession->id);
        } else {
            if (Auth::check()) {
                $query->where('user_id', Auth::id());
            } else {
                $query->whereNull('user_id');
            }
        }

        $messages = $query->take(100)->get()->map(fn ($msg) => $this->formatMessage($msg));

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function listSessions(): JsonResponse
    {
        $sessions = $this->sessionQuery()
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($session) => $this->formatSession($session));

        return response()->json([
            'sessions' => $sessions,
        ]);
    }

    public function createSession(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'session_id' => 'nullable|string|max:191',
            'device_id' => 'nullable|string|max:255',
            'provider' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
        ]);

        $session = $this->createSessionRecord($request->only([
            'name',
            'session_id',
            'device_id',
            'provider',
            'model',
        ]));

        return response()->json([
            'session' => $this->formatSession($session),
        ], 201);
    }

    public function showSessionMessages(ChatSession $chatSession): JsonResponse
    {
        $this->ensureSessionOwnership($chatSession);

        $messages = $chatSession->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($msg) => $this->formatMessage($msg));

        return response()->json([
            'session' => $this->formatSession($chatSession),
            'messages' => $messages,
        ]);
    }

    public function updateSession(Request $request, ChatSession $chatSession): JsonResponse
    {
        $this->ensureSessionOwnership($chatSession);

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $chatSession->name = $request->name;
        $chatSession->save();

        return response()->json([
            'session' => $this->formatSession($chatSession),
        ]);
    }

    public function deleteSession(ChatSession $chatSession): JsonResponse
    {
        $this->ensureSessionOwnership($chatSession);
        $chatSession->messages()->delete();
        $chatSession->delete();

        return response()->json([
            'success' => true,
        ]);
    }

    public function clearSessionMessages(string $session_id): JsonResponse
    {
        try {
            $chatSession = (clone $this->sessionQuery())
                ->where('session_id', $session_id)
                ->first();

            if (!$chatSession) {
                return response()->json([
                    'success' => false,
                    'error' => 'Session not found'
                ], 404);
            }

        $this->ensureSessionOwnership($chatSession);
        $chatSession->messages()->delete();
        $this->updateSessionMetadata($chatSession, ['last_message_at' => null]);

        return response()->json([
            'success' => true,
        ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save messages to database (called after getting response from agent-bridge)
     * Lưu cả tool_calls, iterations, device_id để restore đầy đủ khi F5
     */
    public function saveMessages(Request $request)
    {
        $request->validate([
            'user_message' => 'required|array',
            'assistant_message' => 'required|array',
            'device_id' => 'nullable|string',
            'session_id' => 'nullable|string|max:191',
            'session_name' => 'nullable|string|max:255',
            'provider' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
        ]);

        try {
            $chatSession = $this->getOrCreateSession(
                $request->input('session_id'),
                [
                    'name' => $request->input('session_name'),
                    'device_id' => $request->input('device_id'),
                    'provider' => $request->input('provider'),
                    'model' => $request->input('model'),
                ]
            );

            $userMessage = Message::create([
                'content' => $request->user_message['content'],
                'role' => 'user',
                'user_id' => Auth::check() ? Auth::id() : null,
                'chat_session_id' => $chatSession->id,
                'device_id' => $request->device_id,
            ]);

            $assistantMessage = Message::create([
                'content' => $request->assistant_message['content'] ?? '',
                'role' => 'assistant',
                'user_id' => Auth::check() ? Auth::id() : null,
                'tool_calls' => $request->assistant_message['tool_calls'] ?? null,
                'iterations' => $request->assistant_message['iterations'] ?? 0,
                'device_id' => $request->device_id,
                'chat_session_id' => $chatSession->id,
                'metadata' => $request->assistant_message['metadata'] ?? null,
            ]);

            $this->updateSessionMetadata($chatSession, [
                'device_id' => $request->device_id,
                'provider' => $request->provider,
                'model' => $request->model,
                'last_message_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'user_message' => $userMessage,
                'assistant_message' => $assistantMessage,
                'session' => $this->formatSession($chatSession),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update assistant message (for realtime updates)
     */
    public function updateMessage(Request $request)
    {
        $request->validate([
            'message_id' => 'required|integer',
            'content' => 'nullable|string',
            'tool_calls' => 'nullable|array',
            'iterations' => 'nullable|integer',
            'metadata' => 'nullable|array',
            'session_id' => 'nullable|string|max:191',
        ]);

        try {
            $message = Message::findOrFail($request->message_id);

            $chatSession = $message->chatSession;
            if ($chatSession) {
                $this->ensureSessionOwnership($chatSession);
            } elseif ($request->filled('session_id')) {
                $chatSession = (clone $this->sessionQuery())
                    ->where('session_id', $request->session_id)
                    ->first();
                if ($chatSession) {
                    $message->chat_session_id = $chatSession->id;
                }
            }

            if ($request->has('content')) {
                $message->content = $request->input('content');
            }
            if ($request->has('tool_calls')) {
                $message->tool_calls = $request->tool_calls;
            }
            if ($request->has('iterations')) {
                $message->iterations = $request->iterations;
            }
            if ($request->has('metadata')) {
                $message->metadata = $request->metadata;
            }

            $message->save();

            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all chat history
     */
    public function clear(Request $request)
    {
        try {
            $sessionId = $request->input('session_id');
            $deletedCount = 0;

            if ($sessionId) {
                // Tìm session theo session_id, không dùng firstOrFail để tránh lỗi nếu không tìm thấy
                $chatSession = (clone $this->sessionQuery())
                    ->where('session_id', $sessionId)
                    ->first();

                if (!$chatSession) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy session để xóa',
                        'error' => 'Session not found'
                    ], 404);
                }

                $this->ensureSessionOwnership($chatSession);
                $deletedCount = $chatSession->messages()->delete();
                $this->updateSessionMetadata($chatSession, ['last_message_at' => null]);
            } else {
                // Xóa tất cả messages của user hiện tại
                $sessions = $this->sessionQuery()->get();
                foreach ($sessions as $session) {
                    $deletedCount += $session->messages()->delete();
                    $this->updateSessionMetadata($session, ['last_message_at' => null]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa lịch sử chat thành công',
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Lỗi khi xóa lịch sử chat: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get messages for a session (for DualSession sync from Python agent)
     * GET /api/chat/session/{session_id}/messages
     */
    public function getSessionMessages(string $session_id): JsonResponse
    {
        try {
            $chatSession = (clone $this->sessionQuery())
                ->where('session_id', $session_id)
                ->first();

            if (!$chatSession) {
                return response()->json([
                    'messages' => []
                ]);
            }

            $messages = $chatSession->messages()
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(fn ($msg) => [
                    'role' => $msg->role,
                    'content' => $msg->content,
                    'tool_calls' => $msg->tool_calls,
                    'metadata' => $msg->metadata ?? [],
                ]);

            return response()->json([
                'messages' => $messages,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync messages to session (for DualSession sync from Python agent)
     * POST /api/chat/session/{session_id}/messages
     */
    public function syncSessionMessages(Request $request, string $session_id): JsonResponse
    {
        try {
            $request->validate([
                'messages' => 'required|array',
                'messages.*.role' => 'required|string|in:user,assistant,system',
                'messages.*.content' => 'nullable|string',
                'messages.*.tool_calls' => 'nullable|array',
                'messages.*.metadata' => 'nullable|array',
            ]);

            $chatSession = $this->getOrCreateSession($session_id);

            $created = [];
            foreach ($request->input('messages', []) as $msgData) {
                $message = Message::create([
                    'content' => $msgData['content'] ?? '',
                    'role' => $msgData['role'],
                    'user_id' => Auth::check() ? Auth::id() : null,
                    'chat_session_id' => $chatSession->id,
                    'tool_calls' => $msgData['tool_calls'] ?? null,
                    'metadata' => $msgData['metadata'] ?? null,
                ]);
                $created[] = $message;
            }

            $this->updateSessionMetadata($chatSession, [
                'last_message_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'created_count' => count($created),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove last message from session (for DualSession pop_item)
     * DELETE /api/chat/session/{session_id}/messages/last
     */
    public function removeLastMessage(string $session_id): JsonResponse
    {
        try {
            $chatSession = (clone $this->sessionQuery())
                ->where('session_id', $session_id)
                ->first();

            if (!$chatSession) {
                return response()->json([
                    'success' => false,
                    'error' => 'Session not found'
                ], 404);
            }

            $lastMessage = $chatSession->messages()
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastMessage) {
                $lastMessage->delete();
                return response()->json([
                    'success' => true,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'No messages to remove'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

