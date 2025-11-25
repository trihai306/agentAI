<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    /**
     * Display a listing of chat sessions.
     */
    public function index(Request $request): Response
    {
        $query = ChatSession::with(['user']);

        // Filters
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('session_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $sessions = $query->withCount('messages')->paginate($perPage)->withQueryString();

        // Stats
        $stats = [
            'total_sessions' => ChatSession::count(),
            'today_sessions' => ChatSession::whereDate('created_at', today())->count(),
            'active_sessions' => ChatSession::where('last_message_at', '>=', now()->subDays(7))->count(),
        ];

        return Inertia::render('Admin/Sessions/Index', [
            'sessions' => $sessions,
            'stats' => $stats,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Display the specified session.
     */
    public function show($session): Response
    {
        $chatSession = ChatSession::with(['user', 'messages' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }])->findOrFail($session);

        return Inertia::render('Admin/Sessions/Show', [
            'session' => $chatSession,
        ]);
    }

    /**
     * Remove the specified session.
     */
    public function destroy($session)
    {
        $chatSession = ChatSession::findOrFail($session);
        $chatSession->messages()->delete();
        $chatSession->delete();

        return redirect()->route('admin.sessions.index')
            ->with('success', 'Session đã được xóa thành công.');
    }
}
