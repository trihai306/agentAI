<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\Api\ModelProxyController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

// Model Proxy API routes (new - for agent-bridge)
Route::post('/models/chat', [ModelProxyController::class, 'chat'])->name('api.models.chat');

// AI with Phone Automation - API routes (legacy - kept for backward compatibility)
Route::post('/ai/chat', [AIController::class, 'chatWithPhone'])->name('api.ai.chat');
Route::get('/ai/tools', [AIController::class, 'getTools'])->name('api.ai.tools');

// Chat API routes (no CSRF protection)
Route::delete('/chat/clear', [ChatController::class, 'clear'])->name('api.chat.clear');

// Session messages API for DualSession sync (Python agent)
Route::prefix('chat/session/{session_id}')->group(function () {
    Route::get('/messages', [ChatController::class, 'getSessionMessages'])->name('api.chat.session.messages');
    Route::post('/messages', [ChatController::class, 'syncSessionMessages'])->name('api.chat.session.messages.sync');
    Route::delete('/messages', [ChatController::class, 'clearSessionMessages'])->name('api.chat.session.messages.clear');
    Route::delete('/messages/last', [ChatController::class, 'removeLastMessage'])->name('api.chat.session.messages.last');
});

