<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    /**
     * Display a listing of messages.
     */
    public function index(Request $request): Response
    {
        $query = Message::with(['user', 'chatSession']);

        // Filters
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('content', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('chatSession', function ($q) use ($search) {
                      $q->where('session_id', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
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
        $messages = $query->paginate($perPage)->withQueryString();

        // Stats
        $stats = [
            'total_messages' => Message::count(),
            'today_messages' => Message::whereDate('created_at', today())->count(),
            'user_messages' => Message::where('role', 'user')->count(),
            'assistant_messages' => Message::where('role', 'assistant')->count(),
        ];

        return Inertia::render('Admin/Messages/Index', [
            'messages' => $messages,
            'stats' => $stats,
            'filters' => $request->only(['role', 'search', 'date_from', 'date_to', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Display the specified message.
     */
    public function show($message): Response
    {
        $msg = Message::with(['user', 'chatSession'])->findOrFail($message);

        return Inertia::render('Admin/Messages/Show', [
            'message' => $msg,
        ]);
    }

    /**
     * Remove the specified message.
     */
    public function destroy($message)
    {
        $msg = Message::findOrFail($message);
        $msg->delete();

        return redirect()->back()
            ->with('success', 'Message đã được xóa thành công.');
    }
}
