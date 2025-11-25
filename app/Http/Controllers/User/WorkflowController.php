<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Models\WorkflowEdge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    /**
     * Display a listing of the user's workflows.
     */
    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $filters = $request->only(['search', 'category', 'is_active', 'is_public', 'sort_by', 'sort_order', 'per_page']);

        $query = Workflow::with(['workflowNodes', 'workflowEdges'])->where('user_id', $userId);

        // Apply filters
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['is_public'])) {
            $query->where('is_public', $filters['is_public']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        $workflows = $query->paginate($perPage);

        // Get categories for filter
        $categories = Workflow::where('user_id', $userId)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->toArray();

        // Calculate stats
        $stats = [
            'total' => Workflow::where('user_id', $userId)->count(),
            'active' => Workflow::where('user_id', $userId)->where('is_active', true)->count(),
            'public' => Workflow::where('user_id', $userId)->where('is_public', true)->count(),
        ];

        return Inertia::render('User/Workflows/Index', [
            'workflows' => $workflows,
            'categories' => $categories,
            'filters' => $filters,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created workflow.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'nodes' => 'nullable|array',
            'edges' => 'nullable|array',
            'tool_calls' => 'nullable|array',
            'tasks' => 'nullable|array',
            'metadata' => 'nullable|array',
            'category' => 'nullable|string|max:255',
            'is_public' => 'boolean',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }
            return back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $workflow = Workflow::create([
                'user_id' => Auth::id(),
                'name' => $request->name,
                'description' => $request->description,
                'nodes' => $request->nodes ?? [], // For backward compatibility
                'edges' => $request->edges ?? [], // For backward compatibility
                'tool_calls' => $request->tool_calls,
                'tasks' => $request->tasks,
                'metadata' => $request->metadata,
                'category' => $request->category,
                'is_public' => $request->is_public ?? false,
            ]);

            // Save nodes and edges to database tables
            if ($request->has('nodes') && is_array($request->nodes) && !empty($request->nodes)) {
                $workflow->saveNodesAndEdges($request->nodes, $request->edges ?? []);
            }

            // Load relationships for response
            $workflow->load(['workflowNodes', 'workflowEdges']);

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Workflow đã được tạo thành công.',
                    'workflow' => $workflow,
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi khi tạo workflow: ' . $e->getMessage(),
                ], 500);
            }
            return back()->with('error', 'Lỗi khi tạo workflow: ' . $e->getMessage());
        }

        return redirect()->route('workflows.index')
            ->with('success', 'Workflow đã được tạo thành công.');
    }

    /**
     * Display the specified workflow.
     */
    public function show(int $id): Response
    {
        $userId = Auth::id();
        $workflow = Workflow::with(['workflowNodes', 'workflowEdges'])
            ->where('user_id', $userId)
            ->orWhere(function ($query) {
                $query->where('is_public', true)
                      ->where('is_active', true);
            })
            ->findOrFail($id);

        return Inertia::render('User/Workflows/Show', [
            'workflow' => $workflow,
        ]);
    }

    /**
     * Update the specified workflow.
     */
    public function update(Request $request, int $id)
    {
        $userId = Auth::id();
        $workflow = Workflow::where('user_id', $userId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'nodes' => 'nullable|array',
            'edges' => 'nullable|array',
            'tool_calls' => 'nullable|array',
            'tasks' => 'nullable|array',
            'metadata' => 'nullable|array',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $workflow->update($request->only([
                'name',
                'description',
                'tool_calls',
                'tasks',
                'metadata',
                'category',
                'is_active',
                'is_public',
            ]));

            // Update nodes and edges if provided
            if ($request->has('nodes') && is_array($request->nodes)) {
                $workflow->saveNodesAndEdges($request->nodes, $request->edges ?? []);
            }

            // Load relationships for response
            $workflow->load(['workflowNodes', 'workflowEdges']);

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Workflow đã được cập nhật thành công.',
                    'workflow' => $workflow,
                ]);
            }

            return redirect()->route('workflows.index')
                ->with('success', 'Workflow đã được cập nhật thành công.');
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi khi cập nhật workflow: ' . $e->getMessage(),
                ], 500);
            }
            return back()->with('error', 'Lỗi khi cập nhật workflow: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified workflow.
     */
    public function destroy(int $id)
    {
        $userId = Auth::id();
        $workflow = Workflow::where('user_id', $userId)->findOrFail($id);
        $workflow->delete();

        return redirect()->route('workflows.index')
            ->with('success', 'Workflow đã được xóa thành công.');
    }

    /**
     * Duplicate a workflow.
     */
    public function duplicate(int $id)
    {
        $userId = Auth::id();
        $originalWorkflow = Workflow::where('user_id', $userId)
            ->orWhere(function ($query) {
                $query->where('is_public', true)
                      ->where('is_active', true);
            })
            ->findOrFail($id);

        $newWorkflow = $originalWorkflow->replicate();
        $newWorkflow->user_id = $userId;
        $newWorkflow->name = $originalWorkflow->name . ' (Copy)';
        $newWorkflow->is_public = false;
        $newWorkflow->usage_count = 0;
        $newWorkflow->last_used_at = null;
        $newWorkflow->save();

        return redirect()->route('workflows.index')
            ->with('success', 'Workflow đã được sao chép thành công.');
    }

    /**
     * Mark workflow as used (increment usage count).
     */
    public function markAsUsed(int $id)
    {
        $userId = Auth::id();
        $workflow = Workflow::where('user_id', $userId)
            ->orWhere(function ($query) {
                $query->where('is_public', true)
                      ->where('is_active', true);
            })
            ->findOrFail($id);

        $workflow->markAsUsed();

        return response()->json([
            'success' => true,
            'usage_count' => $workflow->usage_count,
        ]);
    }

    /**
     * Get public workflows (for sharing).
     */
    public function public(Request $request)
    {
        $query = Workflow::where('is_public', true)
            ->where('is_active', true);

        // Apply filters
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $perPage = $request->get('per_page', 15);
        $workflows = $query->orderBy('usage_count', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'workflows' => $workflows,
        ]);
    }
}
