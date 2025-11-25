<?php

namespace App\Http\Controllers;

use App\Services\UserDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserDataController extends Controller
{
    protected UserDataService $dataService;

    public function __construct(UserDataService $dataService)
    {
        $this->dataService = $dataService;
    }

    /**
     * Display a listing of collections.
     */
    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $filters = $request->only(['type', 'is_active', 'is_public', 'search', 'sort_by', 'sort_order', 'per_page']);

        $collections = $this->dataService->getCollections($userId, $filters);

        // Get collection types for filter
        $types = \App\Models\UserDataCollection::where('user_id', $userId)
            ->distinct()
            ->pluck('type')
            ->toArray();

        // Get sidebar data (all collections grouped by type)
        $allCollections = $this->dataService->getCollections($userId, [], 1000);
        $sidebarCollections = $allCollections->items();

        // Get statistics for sidebar and resource consumption
        $statistics = $this->dataService->getCollectionStatistics($userId);

        return Inertia::render('User/Data/Index', [
            'collections' => $collections,
            'filters' => $filters,
            'types' => $types,
            'sidebarCollections' => $sidebarCollections,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new collection.
     */
    public function create(): Response
    {
        return Inertia::render('User/Data/Create');
    }

    /**
     * Store a newly created collection.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'metadata' => 'nullable|array',
            'items' => 'nullable|array',
            'items.*.key' => 'nullable|string|max:255',
            'items.*.value' => 'nullable',
            'items.*.label' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.data_type' => 'nullable|string|in:string,number,integer,float,boolean,json,array,object',
            'items.*.order' => 'nullable|integer',
            'items.*.tags' => 'nullable|array',
        ]);

        $userId = Auth::id();
        $collection = $this->dataService->createCollection($userId, $validated);

        return redirect()->route('user.data.show', $collection->id)
            ->with('success', 'Đã tạo collection thành công');
    }

    /**
     * Display the specified collection.
     */
    public function show(Request $request, int $id): Response
    {
        $userId = Auth::id();
        $collection = $this->dataService->getCollection($userId, $id);

        if (!$collection) {
            abort(404, 'Collection không tồn tại');
        }

        // Get items with filters
        $itemFilters = $request->only(['is_active', 'key', 'data_type', 'tag', 'search', 'sort_by', 'sort_order', 'per_page']);
        $items = $this->dataService->getItems($userId, $id, $itemFilters);

        // Get sidebar data (all collections grouped by type)
        $allCollections = $this->dataService->getCollections($userId, [], 1000);
        $sidebarCollections = $allCollections->items();

        // Get statistics for sidebar
        $statistics = $this->dataService->getCollectionStatistics($userId);

        return Inertia::render('User/Data/Show', [
            'collection' => $collection,
            'items' => $items,
            'filters' => $itemFilters,
            'sidebarCollections' => $sidebarCollections,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for editing the specified collection.
     */
    public function edit(int $id): Response
    {
        $userId = Auth::id();
        $collection = $this->dataService->getCollection($userId, $id);

        if (!$collection) {
            abort(404, 'Collection không tồn tại');
        }

        // Get sidebar data (all collections grouped by type)
        $allCollections = $this->dataService->getCollections($userId, [], 1000);
        $sidebarCollections = $allCollections->items();

        // Get statistics for sidebar
        $statistics = $this->dataService->getCollectionStatistics($userId);

        return Inertia::render('User/Data/Edit', [
            'collection' => $collection,
            'sidebarCollections' => $sidebarCollections,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Update the specified collection.
     */
    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $userId = Auth::id();
        $collection = $this->dataService->updateCollection($userId, $id, $validated);

        if (!$collection) {
            return back()->with('error', 'Collection không tồn tại');
        }

        return redirect()->route('user.data.show', $id)
            ->with('success', 'Đã cập nhật collection thành công');
    }

    /**
     * Remove the specified collection.
     */
    public function destroy(int $id)
    {
        $userId = Auth::id();
        $deleted = $this->dataService->deleteCollection($userId, $id);

        if (!$deleted) {
            return back()->with('error', 'Collection không tồn tại');
        }

        return redirect()->route('user.data.index')
            ->with('success', 'Đã xóa collection thành công');
    }

    /**
     * Duplicate a collection.
     */
    public function duplicate(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
        ]);

        $userId = Auth::id();
        $newCollection = $this->dataService->duplicateCollection($userId, $id, $validated['name'] ?? null);

        if (!$newCollection) {
            return back()->with('error', 'Collection không tồn tại');
        }

        return redirect()->route('user.data.show', $newCollection->id)
            ->with('success', 'Đã sao chép collection thành công');
    }

    /**
     * Store a newly created item.
     */
    public function storeItem(Request $request, int $collectionId)
    {
        $validated = $request->validate([
            'key' => 'nullable|string|max:255',
            'value' => 'nullable',
            'label' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'data_type' => 'nullable|string|in:string,number,integer,float,boolean,json,array,object',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $userId = Auth::id();
        $item = $this->dataService->createItem($userId, $collectionId, $validated);

        if (!$item) {
            return back()->with('error', 'Collection không tồn tại');
        }

        return back()->with('success', 'Đã tạo item thành công');
    }

    /**
     * Update the specified item.
     */
    public function updateItem(Request $request, int $itemId)
    {
        $validated = $request->validate([
            'key' => 'nullable|string|max:255',
            'value' => 'nullable',
            'label' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'data_type' => 'nullable|string|in:string,number,integer,float,boolean,json,array,object',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $userId = Auth::id();
        $item = $this->dataService->updateItem($userId, $itemId, $validated);

        if (!$item) {
            return back()->with('error', 'Item không tồn tại');
        }

        return back()->with('success', 'Đã cập nhật item thành công');
    }

    /**
     * Remove the specified item.
     */
    public function destroyItem(int $itemId)
    {
        $userId = Auth::id();
        $deleted = $this->dataService->deleteItem($userId, $itemId);

        if (!$deleted) {
            return back()->with('error', 'Item không tồn tại');
        }

        return back()->with('success', 'Đã xóa item thành công');
    }

    /**
     * Bulk import items.
     */
    public function bulkImportItems(Request $request, int $collectionId)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.key' => 'nullable|string|max:255',
            'items.*.value' => 'nullable',
            'items.*.label' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.data_type' => 'nullable|string|in:string,number,integer,float,boolean,json,array,object',
            'items.*.order' => 'nullable|integer',
            'items.*.tags' => 'nullable|array',
        ]);

        $userId = Auth::id();

        try {
            $items = $this->dataService->bulkImportItems($userId, $collectionId, $validated['items']);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Đã import ' . count($items) . ' items thành công',
                    'count' => count($items),
                ]);
            }

            return back()->with('success', 'Đã import ' . count($items) . ' items thành công');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi khi import: ' . $e->getMessage(),
                ], 500);
            }

            return back()->with('error', 'Lỗi khi import: ' . $e->getMessage());
        }
    }

    /**
     * Bulk create items with template.
     */
    public function bulkCreateItems(Request $request, int $collectionId)
    {
        $validated = $request->validate([
            'template' => 'required|array',
            'count' => 'required|integer|min:1|max:5000',
            'start_index' => 'nullable|integer|min:1',
        ]);

        $userId = Auth::id();
        $count = $validated['count'];
        $startIndex = $validated['start_index'] ?? 1;

        try {
            $items = $this->dataService->bulkCreateItemsWithTemplate(
                $userId,
                $collectionId,
                $validated['template'],
                $count,
                $startIndex
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Đã tạo ' . count($items) . ' items thành công',
                    'count' => count($items),
                ]);
            }

            return back()->with('success', 'Đã tạo ' . count($items) . ' items thành công');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi khi tạo: ' . $e->getMessage(),
                ], 500);
            }

            return back()->with('error', 'Lỗi khi tạo: ' . $e->getMessage());
        }
    }

    /**
     * Validate bulk items before import.
     */
    public function validateBulkItems(Request $request, int $collectionId)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.key' => 'nullable|string|max:255',
            'items.*.value' => 'nullable',
            'items.*.label' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.data_type' => 'nullable|string|in:string,number,integer,float,boolean,json,array,object',
        ]);

        $errors = [];
        foreach ($validated['items'] as $index => $item) {
            if (empty($item['key']) && empty($item['value'])) {
                $errors[] = [
                    'row' => $index + 1,
                    'message' => 'Thiếu key hoặc value',
                ];
            }
        }

        return response()->json([
            'valid' => count($errors) === 0,
            'errors' => $errors,
            'total' => count($validated['items']),
        ]);
    }

    /**
     * Get collection for workflow (API endpoint).
     */
    public function getForWorkflow(int $id)
    {
        $userId = Auth::id();
        $data = $this->dataService->getCollectionForWorkflow($userId, $id);

        if (!$data) {
            return response()->json(['error' => 'Collection không tồn tại'], 404);
        }

        return response()->json($data);
    }

    /**
     * Get collections by type for workflow (API endpoint).
     */
    public function getByTypeForWorkflow(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
        ]);

        $userId = Auth::id();
        $data = $this->dataService->getCollectionsByTypeForWorkflow($userId, $validated['type']);

        return response()->json($data);
    }

    /**
     * Get statistics.
     */
    public function statistics(): Response
    {
        $userId = Auth::id();
        $stats = $this->dataService->getCollectionStatistics($userId);
        $analytics = $this->dataService->getAnalytics($userId);

        // Get sidebar data (all collections grouped by type)
        $allCollections = $this->dataService->getCollections($userId, [], 1000);
        $sidebarCollections = $allCollections->items();

        return Inertia::render('User/Data/Statistics', [
            'statistics' => $stats,
            'analytics' => $analytics,
            'sidebarCollections' => $sidebarCollections,
        ]);
    }

    /**
     * Get statistics (API endpoint).
     */
    public function getStatistics()
    {
        $userId = Auth::id();
        $stats = $this->dataService->getCollectionStatistics($userId);
        $analytics = $this->dataService->getAnalytics($userId);

        return response()->json([
            'statistics' => $stats,
            'analytics' => $analytics,
        ]);
    }

    /**
     * Export collection to JSON.
     */
    public function exportJson(int $id)
    {
        $userId = Auth::id();

        try {
            $data = $this->dataService->exportCollection($userId, $id);

            return response()->json($data, 200, [
                'Content-Type' => 'application/json',
                'Content-Disposition' => 'attachment; filename="collection-' . $id . '-' . now()->format('Y-m-d') . '.json"',
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Lỗi khi export: ' . $e->getMessage());
        }
    }

    /**
     * Export collection to CSV.
     */
    public function exportCsv(int $id)
    {
        $userId = Auth::id();

        try {
            $csvContent = $this->dataService->exportCollectionToCsv($userId, $id);

            return response($csvContent, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="collection-' . $id . '-' . now()->format('Y-m-d') . '.csv"',
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Lỗi khi export: ' . $e->getMessage());
        }
    }

    /**
     * Import collection from JSON.
     */
    public function importJson(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:json|max:10240',
            'name' => 'nullable|string|max:255',
        ]);

        $userId = Auth::id();

        try {
            $content = file_get_contents($validated['file']->getRealPath());
            $data = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return back()->with('error', 'File JSON không hợp lệ');
            }

            $collection = $this->dataService->importCollection($userId, $data, $validated['name'] ?? null);

            return redirect()->route('user.data.show', $collection->id)
                ->with('success', 'Đã import collection thành công');
        } catch (\Exception $e) {
            return back()->with('error', 'Lỗi khi import: ' . $e->getMessage());
        }
    }

    /**
     * Import collection from CSV.
     */
    public function importCsv(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $userId = Auth::id();

        try {
            $content = file_get_contents($validated['file']->getRealPath());

            $collectionData = [
                'name' => $validated['name'],
                'type' => $validated['type'],
                'description' => $validated['description'] ?? null,
            ];

            $collection = $this->dataService->importCollectionFromCsv($userId, $content, $collectionData);

            return redirect()->route('user.data.show', $collection->id)
                ->with('success', 'Đã import collection thành công');
        } catch (\Exception $e) {
            return back()->with('error', 'Lỗi khi import: ' . $e->getMessage());
        }
    }

    /**
     * Get most used collections.
     */
    public function mostUsed(Request $request)
    {
        $userId = Auth::id();
        $limit = $request->get('limit', 10);

        $collections = $this->dataService->getMostUsedCollections($userId, $limit);

        return response()->json($collections);
    }

    /**
     * Get recent collections.
     */
    public function recent(Request $request)
    {
        $userId = Auth::id();
        $limit = $request->get('limit', 10);

        $collections = $this->dataService->getRecentCollections($userId, $limit);

        return response()->json($collections);
    }

    /**
     * Search collections.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $userId = Auth::id();
        $filters = $request->only(['type', 'is_active', 'is_public']);

        $collections = $this->dataService->searchCollections($userId, $validated['query'], $filters);

        return response()->json($collections);
    }

    /**
     * Reorder items.
     */
    public function reorderItems(Request $request, int $collectionId)
    {
        $validated = $request->validate([
            'item_orders' => 'required|array',
            'item_orders.*' => 'required|integer',
        ]);

        $success = $this->dataService->reorderItems($collectionId, $validated['item_orders']);

        if ($success) {
            return back()->with('success', 'Đã sắp xếp lại items thành công');
        }

        return back()->with('error', 'Lỗi khi sắp xếp items');
    }

    /**
     * Bulk delete items.
     */
    public function bulkDeleteItems(Request $request, int $collectionId)
    {
        $validated = $request->validate([
            'item_ids' => 'required|array',
            'item_ids.*' => 'required|integer',
        ]);

        $userId = Auth::id();
        $deleted = $this->dataService->deleteItems($userId, $collectionId, $validated['item_ids']);

        return back()->with('success', "Đã xóa {$deleted} items thành công");
    }

    /**
     * Get item statistics.
     */
    public function itemStatistics(int $collectionId)
    {
        $stats = $this->dataService->getItemStatistics($collectionId);

        return response()->json($stats);
    }

    /**
     * Bulk delete collections.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:user_data_collections,id',
        ]);

        $userId = Auth::id();
        $deleted = 0;

        foreach ($validated['ids'] as $id) {
            $collection = $this->dataService->getCollection($userId, $id);
            if ($collection) {
                $this->dataService->deleteCollection($userId, $id);
                $deleted++;
            }
        }

        return back()->with('success', "Đã xóa {$deleted} collection(s) thành công");
    }

    /**
     * Bulk toggle status of collections.
     */
    public function bulkToggleStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:user_data_collections,id',
            'is_active' => 'required|boolean',
        ]);

        $userId = Auth::id();
        $updated = 0;

        foreach ($validated['ids'] as $id) {
            $collection = $this->dataService->getCollection($userId, $id);
            if ($collection) {
                $this->dataService->updateCollection($userId, $id, [
                    'is_active' => $validated['is_active']
                ]);
                $updated++;
            }
        }

        return back()->with('success', "Đã cập nhật trạng thái {$updated} collection(s) thành công");
    }

    /**
     * Bulk export collections as JSON.
     */
    public function bulkExportJson(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|string',
        ]);

        $ids = explode(',', $validated['ids']);
        $userId = Auth::id();
        $collections = [];

        foreach ($ids as $id) {
            $collection = $this->dataService->getCollection($userId, (int)$id);
            if ($collection) {
                $items = $this->dataService->getItems($userId, (int)$id, []);
                $collections[] = [
                    'collection' => $collection,
                    'items' => $items->items(),
                ];
            }
        }

        return response()->json($collections, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="collections_' . date('Y-m-d_His') . '.json"',
        ]);
    }

    /**
     * Bulk export collections as CSV.
     */
    public function bulkExportCsv(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|string',
        ]);

        $ids = explode(',', $validated['ids']);
        $userId = Auth::id();
        $csvData = [];
        $csvData[] = ['Collection ID', 'Collection Name', 'Type', 'Item Count', 'Status', 'Public', 'Created At'];

        foreach ($ids as $id) {
            $collection = $this->dataService->getCollection($userId, (int)$id);
            if ($collection) {
                $csvData[] = [
                    $collection->id,
                    $collection->name,
                    $collection->type,
                    $collection->item_count ?? 0,
                    $collection->is_active ? 'Active' : 'Inactive',
                    $collection->is_public ? 'Public' : 'Private',
                    $collection->created_at,
                ];
            }
        }

        $filename = 'collections_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        foreach ($csvData as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
