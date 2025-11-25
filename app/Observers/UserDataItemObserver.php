<?php

namespace App\Observers;

use App\Models\UserDataItem;
use Illuminate\Support\Facades\Log;

class UserDataItemObserver
{
    /**
     * Handle the UserDataItem "created" event.
     */
    public function created(UserDataItem $userDataItem): void
    {
        // Update collection item count
        $this->updateCollectionItemCount($userDataItem->collection_id);

        Log::info('UserDataItem created', [
            'id' => $userDataItem->id,
            'collection_id' => $userDataItem->collection_id,
            'key' => $userDataItem->key,
        ]);
    }

    /**
     * Handle the UserDataItem "updated" event.
     */
    public function updated(UserDataItem $userDataItem): void
    {
        Log::info('UserDataItem updated', [
            'id' => $userDataItem->id,
            'collection_id' => $userDataItem->collection_id,
        ]);
    }

    /**
     * Handle the UserDataItem "deleted" event.
     */
    public function deleted(UserDataItem $userDataItem): void
    {
        // Update collection item count
        $this->updateCollectionItemCount($userDataItem->collection_id);

        Log::info('UserDataItem deleted', [
            'id' => $userDataItem->id,
            'collection_id' => $userDataItem->collection_id,
        ]);
    }

    /**
     * Handle the UserDataItem "restored" event.
     */
    public function restored(UserDataItem $userDataItem): void
    {
        // Update collection item count
        $this->updateCollectionItemCount($userDataItem->collection_id);

        Log::info('UserDataItem restored', [
            'id' => $userDataItem->id,
            'collection_id' => $userDataItem->collection_id,
        ]);
    }

    /**
     * Handle the UserDataItem "force deleted" event.
     */
    public function forceDeleted(UserDataItem $userDataItem): void
    {
        // Update collection item count
        $this->updateCollectionItemCount($userDataItem->collection_id);

        Log::info('UserDataItem force deleted', [
            'id' => $userDataItem->id,
            'collection_id' => $userDataItem->collection_id,
        ]);
    }

    /**
     * Update collection item count.
     */
    protected function updateCollectionItemCount(int $collectionId): void
    {
        $collection = \App\Models\UserDataCollection::find($collectionId);
        if ($collection) {
            $collection->updateItemCount();
        }
    }
}
