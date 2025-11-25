<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display admin dashboard
     */
    public function dashboard(): Response
    {
        return Inertia::render('Admin/Dashboard');
    }

    /**
     * Get admin statistics
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'sessions' => ChatSession::count(),
            'messages' => Message::count(),
            'activeUsers' => User::where('updated_at', '>=', now()->subDays(7))->count(),
        ]);
    }
}

