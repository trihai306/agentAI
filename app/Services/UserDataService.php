<?php

namespace App\Services;

use App\Repositories\Contracts\UserDataCollectionRepositoryInterface;
use App\Repositories\Contracts\UserDataItemRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserDataService
{
    protected UserDataCollectionRepositoryInterface $collectionRepository;
    protected UserDataItemRepositoryInterface $itemRepository;

    public function __construct(
        UserDataCollectionRepositoryInterface $collectionRepository,
        UserDataItemRepositoryInterface $itemRepository
    ) {
        $this->collectionRepository = $collectionRepository;
        $this->itemRepository = $itemRepository;
    }

    // ==================== Collection Methods ====================

    /**
     * Get all collections for a user.
     */
    public function getCollections(int $userId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;
        return $this->collectionRepository->getAll($userId, $filters, $perPage);
    }

    /**
     * Get a single collection with items.
     */
    public function getCollection(int $userId, int $collectionId): ?\App\Models\UserDataCollection
    {
        return $this->collectionRepository->findById($userId, $collectionId);
    }

    /**
     * Create a new collection.
     */
    public function createCollection(int $userId, array $data): \App\Models\UserDataCollection
    {
        // Validate data
        $this->validateCollectionData($data);

        return DB::transaction(function () use ($userId, $data) {
            $collectionData = [
                'user_id' => $userId,
                'name' => $data['name'],
                'type' => $data['type'] ?? 'custom',
                'description' => $data['description'] ?? null,
                'icon' => $data['icon'] ?? null,
                'color' => $data['color'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'is_public' => $data['is_public'] ?? false,
                'metadata' => $data['metadata'] ?? null,
            ];

            $collection = $this->collectionRepository->create($collectionData);

            // Create items if provided
            if (isset($data['items']) && is_array($data['items'])) {
                $this->itemRepository->createMany($collection->id, $data['items']);
                $this->collectionRepository->updateItemCount($collection->id);
            }

            return $collection->load('items');
        });
    }

    /**
     * Update a collection.
     */
    public function updateCollection(int $userId, int $collectionId, array $data): ?\App\Models\UserDataCollection
    {
        // Validate data
        $this->validateCollectionData($data, true);

        return $this->collectionRepository->update($userId, $collectionId, $data);
    }

    /**
     * Delete a collection.
     */
    public function deleteCollection(int $userId, int $collectionId): bool
    {
        return $this->collectionRepository->delete($userId, $collectionId);
    }

    /**
     * Duplicate a collection.
     */
    public function duplicateCollection(int $userId, int $collectionId, ?string $newName = null): ?\App\Models\UserDataCollection
    {
        return $this->collectionRepository->duplicate($userId, $collectionId, $newName);
    }

    /**
     * Get collection statistics.
     */
    public function getCollectionStatistics(int $userId): array
    {
        $collections = $this->collectionRepository->getAllWithoutPagination($userId);

        $total = $collections->count();
        $active = $collections->where('is_active', true)->count();
        $public = $collections->where('is_public', true)->count();
        $totalItems = $collections->sum('item_count');

        // Group by type
        $byType = [];
        foreach ($collections as $collection) {
            $type = $collection->type;
            if (!isset($byType[$type])) {
                $byType[$type] = [
                    'count' => 0,
                    'total_items' => 0,
                ];
            }
            $byType[$type]['count']++;
            $byType[$type]['total_items'] += $collection->item_count;
        }

        // Calculate averages
        foreach ($byType as &$data) {
            $data['avg_items'] = $data['count'] > 0 ? round($data['total_items'] / $data['count'], 2) : 0;
        }

        return [
            'total' => $total,
            'active' => $active,
            'public' => $public,
            'total_items' => $totalItems,
            'by_type' => $byType,
        ];
    }

    /**
     * Get collections by type with statistics.
     */
    public function getCollectionsByTypeWithStats(int $userId, string $type): array
    {
        return $this->collectionRepository->getByTypeWithStats($userId, $type);
    }

    /**
     * Search collections.
     */
    public function searchCollections(int $userId, string $query, array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return $this->collectionRepository->search($userId, $query, $filters);
    }

    /**
     * Get most used collections.
     */
    public function getMostUsedCollections(int $userId, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return $this->collectionRepository->getMostUsed($userId, $limit);
    }

    /**
     * Get recent collections.
     */
    public function getRecentCollections(int $userId, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return $this->collectionRepository->getRecent($userId, $limit);
    }

    // ==================== Item Methods ====================

    /**
     * Get items for a collection.
     */
    public function getItems(int $userId, int $collectionId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        // Verify collection belongs to user
        $collection = $this->collectionRepository->findById($userId, $collectionId);
        if (!$collection) {
            return new \Illuminate\Pagination\LengthAwarePaginator([], 0, 50);
        }

        $perPage = $filters['per_page'] ?? 50;
        return $this->itemRepository->getAll($collectionId, $filters, $perPage);
    }

    /**
     * Create items for a collection.
     */
    public function createItems(int $collectionId, array $items): array
    {
        // Validate items
        foreach ($items as $item) {
            $this->validateItemData($item);
        }

        $createdItems = $this->itemRepository->createMany($collectionId, $items);
        $this->collectionRepository->updateItemCount($collectionId);

        return $createdItems;
    }

    /**
     * Create a single item.
     */
    public function createItem(int $userId, int $collectionId, array $data): ?\App\Models\UserDataItem
    {
        // Verify collection belongs to user
        $collection = $this->collectionRepository->findById($userId, $collectionId);
        if (!$collection) {
            return null;
        }

        // Validate data
        $this->validateItemData($data);

        $item = $this->itemRepository->create(array_merge($data, ['collection_id' => $collectionId]));
        $this->collectionRepository->updateItemCount($collectionId);

        return $item;
    }

    /**
     * Update an item.
     */
    public function updateItem(int $userId, int $itemId, array $data): ?\App\Models\UserDataItem
    {
        // Validate data
        $this->validateItemData($data, true);

        return $this->itemRepository->update($userId, $itemId, $data);
    }

    /**
     * Delete an item.
     */
    public function deleteItem(int $userId, int $itemId): bool
    {
        $item = $this->itemRepository->findById($userId, $itemId);
        if (!$item) {
            return false;
        }

        $collectionId = $item->collection_id;
        $deleted = $this->itemRepository->delete($userId, $itemId);

        if ($deleted) {
            $this->collectionRepository->updateItemCount($collectionId);
        }

        return $deleted;
    }

    /**
     * Delete multiple items.
     */
    public function deleteItems(int $userId, int $collectionId, array $itemIds): int
    {
        // Verify collection belongs to user
        $collection = $this->collectionRepository->findById($userId, $collectionId);
        if (!$collection) {
            return 0;
        }

        $deleted = $this->itemRepository->deleteMany($collectionId, $itemIds);

        if ($deleted > 0) {
            $this->collectionRepository->updateItemCount($collectionId);
        }

        return $deleted;
    }

    /**
     * Get item statistics for a collection.
     */
    public function getItemStatistics(int $collectionId): array
    {
        return $this->itemRepository->getStatistics($collectionId);
    }

    /**
     * Search items.
     */
    public function searchItems(int $collectionId, string $query, array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return $this->itemRepository->search($collectionId, $query, $filters);
    }

    /**
     * Reorder items.
     */
    public function reorderItems(int $collectionId, array $itemOrders): bool
    {
        return $this->itemRepository->reorder($collectionId, $itemOrders);
    }

    /**
     * Bulk update items.
     */
    public function bulkUpdateItems(int $collectionId, array $updates): int
    {
        return $this->itemRepository->bulkUpdate($collectionId, $updates);
    }

    /**
     * Bulk import items with chunk processing.
     */
    public function bulkImportItems(int $userId, int $collectionId, array $items): array
    {
        // Verify collection belongs to user
        $collection = $this->collectionRepository->findById($userId, $collectionId);
        if (!$collection) {
            return [];
        }

        // Process in chunks to avoid memory issues
        $chunkSize = 100;
        $chunks = array_chunk($items, $chunkSize);
        $allCreatedItems = [];

        foreach ($chunks as $chunk) {
            // Validate chunk items
            foreach ($chunk as $item) {
                $this->validateItemData($item);
            }

            // Create chunk items
            $createdItems = $this->itemRepository->createMany($collectionId, $chunk);
            $allCreatedItems = array_merge($allCreatedItems, $createdItems);
        }

        // Update item count once after all items are created
        $this->collectionRepository->updateItemCount($collectionId);

        return $allCreatedItems;
    }

    /**
     * Bulk create items with template pattern.
     */
    public function bulkCreateItemsWithTemplate(int $userId, int $collectionId, array $template, int $count, int $startIndex = 1): array
    {
        // Verify collection belongs to user
        $collection = $this->collectionRepository->findById($userId, $collectionId);
        if (!$collection) {
            return [];
        }

        $items = [];
        for ($i = 0; $i < $count; $i++) {
            $index = $startIndex + $i;
            $item = [];

            foreach ($template as $field => $pattern) {
                if (is_string($pattern)) {
                    $value = $pattern;
                    // Replace template variables
                    $value = str_replace('{{index}}', $index, $value);
                    $value = str_replace('{{date}}', now()->format('Y-m-d'), $value);
                    $value = str_replace('{{timestamp}}', now()->timestamp, $value);
                    $value = preg_replace_callback('/{{random\((\d+),(\d+)\)}}/', function($matches) {
                        return rand((int)$matches[1], (int)$matches[2]);
                    }, $value);
                    $value = preg_replace('/{{random}}/', bin2hex(random_bytes(4)), $value);
                    $item[$field] = $value;
                } else {
                    $item[$field] = $pattern;
                }
            }

            $item['order'] = $i;
            $items[] = $item;
        }

        return $this->bulkImportItems($userId, $collectionId, $items);
    }

    // ==================== Workflow Integration ====================

    /**
     * Get collection formatted for workflow.
     */
    public function getCollectionForWorkflow(int $userId, int $collectionId): ?array
    {
        return $this->collectionRepository->getForWorkflow($userId, $collectionId);
    }

    /**
     * Get collections by type for workflow.
     */
    public function getCollectionsByTypeForWorkflow(int $userId, string $type): array
    {
        return $this->collectionRepository->getByTypeForWorkflow($userId, $type);
    }

    // ==================== Export/Import ====================

    /**
     * Export collection to JSON.
     */
    public function exportCollection(int $userId, int $collectionId): array
    {
        $collection = $this->collectionRepository->findById($userId, $collectionId);

        if (!$collection) {
            throw new \Exception('Collection not found');
        }

        $items = $this->itemRepository->getAllWithoutPagination($collectionId);

        return [
            'collection' => [
                'name' => $collection->name,
                'type' => $collection->type,
                'description' => $collection->description,
                'icon' => $collection->icon,
                'color' => $collection->color,
                'metadata' => $collection->metadata,
            ],
            'items' => $items->map(function ($item) {
                return [
                    'key' => $item->key,
                    'value' => $item->getValue(),
                    'data_type' => $item->data_type,
                    'label' => $item->label,
                    'description' => $item->description,
                    'order' => $item->order,
                    'tags' => $item->tags,
                    'metadata' => $item->metadata,
                ];
            })->toArray(),
            'exported_at' => now()->toIso8601String(),
            'version' => '1.0',
        ];
    }

    /**
     * Import collection from JSON.
     */
    public function importCollection(int $userId, array $data, ?string $collectionName = null): \App\Models\UserDataCollection
    {
        $collectionData = [
            'name' => $collectionName ?? $data['collection']['name'] ?? 'Imported Collection',
            'type' => $data['collection']['type'] ?? 'custom',
            'description' => $data['collection']['description'] ?? null,
            'icon' => $data['collection']['icon'] ?? null,
            'color' => $data['collection']['color'] ?? null,
            'metadata' => $data['collection']['metadata'] ?? null,
        ];

        $collection = $this->createCollection($userId, $collectionData);

        if (isset($data['items']) && is_array($data['items'])) {
            $this->itemRepository->createMany($collection->id, $data['items']);
            $this->collectionRepository->updateItemCount($collection->id);
        }

        return $collection->load('items');
    }

    /**
     * Export collection to CSV.
     */
    public function exportCollectionToCsv(int $userId, int $collectionId): string
    {
        $collection = $this->collectionRepository->findById($userId, $collectionId);

        if (!$collection) {
            throw new \Exception('Collection not found');
        }

        $items = $this->itemRepository->getAllWithoutPagination($collectionId);

        $csv = [];
        $csv[] = ['Key', 'Value', 'Label', 'Data Type', 'Description', 'Order', 'Tags'];

        foreach ($items as $item) {
            $csv[] = [
                $item->key ?? '',
                is_array($item->getValue()) || is_object($item->getValue())
                    ? json_encode($item->getValue())
                    : (string) $item->getValue(),
                $item->label ?? '',
                $item->data_type,
                $item->description ?? '',
                $item->order,
                is_array($item->tags) ? implode(', ', $item->tags) : '',
            ];
        }

        $output = fopen('php://temp', 'r+');
        foreach ($csv as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }

    /**
     * Import collection from CSV.
     */
    public function importCollectionFromCsv(int $userId, string $csvContent, array $collectionData): \App\Models\UserDataCollection
    {
        $lines = str_getcsv($csvContent, "\n");
        $headers = str_getcsv(array_shift($lines));

        $items = [];
        foreach ($lines as $line) {
            $row = str_getcsv($line);
            if (count($row) < count($headers)) {
                continue;
            }

            $item = [];
            foreach ($headers as $index => $header) {
                $header = strtolower(trim($header));
                $value = $row[$index] ?? '';

                switch ($header) {
                    case 'key':
                        $item['key'] = $value;
                        break;
                    case 'value':
                        $item['value'] = $value;
                        break;
                    case 'label':
                        $item['label'] = $value;
                        break;
                    case 'data type':
                    case 'datatype':
                        $item['data_type'] = $value;
                        break;
                    case 'description':
                        $item['description'] = $value;
                        break;
                    case 'order':
                        $item['order'] = (int) $value;
                        break;
                    case 'tags':
                        $item['tags'] = !empty($value) ? explode(',', $value) : [];
                        break;
                }
            }

            if (!empty($item)) {
                $items[] = $item;
            }
        }

        $collectionData['items'] = $items;
        return $this->createCollection($userId, $collectionData);
    }

    // ==================== Validation ====================

    /**
     * Validate collection data.
     */
    protected function validateCollectionData(array $data, bool $isUpdate = false): void
    {
        $rules = [
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'metadata' => 'nullable|array',
        ];

        if (!$isUpdate) {
            $rules['items'] = 'nullable|array';
            $rules['items.*.key'] = 'nullable|string|max:255';
            $rules['items.*.value'] = 'nullable';
            $rules['items.*.label'] = 'nullable|string|max:255';
            $rules['items.*.description'] = 'nullable|string';
            $rules['items.*.data_type'] = 'nullable|string|in:string,number,integer,float,boolean,json,array,object';
            $rules['items.*.order'] = 'nullable|integer';
            $rules['items.*.tags'] = 'nullable|array';
        }

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            throw new \Illuminate\Validation\ValidationException($validator);
        }
    }

    /**
     * Validate item data.
     */
    protected function validateItemData(array $data, bool $isUpdate = false): void
    {
        $rules = [
            'key' => 'nullable|string|max:255',
            'value' => 'nullable',
            'label' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'data_type' => 'nullable|string|in:string,number,integer,float,boolean,json,array,object',
            'order' => 'nullable|integer',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
            'tags' => 'nullable|array',
        ];

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            throw new \Illuminate\Validation\ValidationException($validator);
        }
    }

    // ==================== Analytics ====================

    /**
     * Get comprehensive analytics for user.
     */
    public function getAnalytics(int $userId): array
    {
        $stats = $this->collectionRepository->getStatistics($userId);

        $collections = $this->collectionRepository->getAllWithoutPagination($userId);

        $typeAnalytics = [];
        foreach ($collections as $collection) {
            $type = $collection->type;
            if (!isset($typeAnalytics[$type])) {
                $typeAnalytics[$type] = [
                    'count' => 0,
                    'total_items' => 0,
                    'avg_items' => 0,
                    'most_used' => 0,
                ];
            }

            $typeAnalytics[$type]['count']++;
            $typeAnalytics[$type]['total_items'] += $collection->item_count;
        }

        foreach ($typeAnalytics as &$analytics) {
            $analytics['avg_items'] = $analytics['count'] > 0
                ? round($analytics['total_items'] / $analytics['count'], 2)
                : 0;
        }

        return [
            'by_type' => $typeAnalytics,
            'most_used' => $this->getMostUsedCollections($userId, 5)->toArray(),
            'recent' => $this->getRecentCollections($userId, 5)->toArray(),
        ];
    }
}
