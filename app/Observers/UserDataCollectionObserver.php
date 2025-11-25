<?php

namespace App\Observers;

use App\Models\UserDataCollection;
use Illuminate\Support\Facades\Log;

class UserDataCollectionObserver
{
    /**
     * Handle the UserDataCollection "created" event.
     */
    public function created(UserDataCollection $userDataCollection): void
    {
        Log::info('UserDataCollection created', [
            'id' => $userDataCollection->id,
            'user_id' => $userDataCollection->user_id,
            'name' => $userDataCollection->name,
            'type' => $userDataCollection->type,
        ]);
    }

    /**
     * Handle the UserDataCollection "updated" event.
     */
    public function updated(UserDataCollection $userDataCollection): void
    {
        Log::info('UserDataCollection updated', [
            'id' => $userDataCollection->id,
            'user_id' => $userDataCollection->user_id,
            'name' => $userDataCollection->name,
        ]);
    }

    /**
     * Handle the UserDataCollection "deleted" event.
     */
    public function deleted(UserDataCollection $userDataCollection): void
    {
        Log::info('UserDataCollection deleted', [
            'id' => $userDataCollection->id,
            'user_id' => $userDataCollection->user_id,
            'name' => $userDataCollection->name,
        ]);
    }

    /**
     * Handle the UserDataCollection "restored" event.
     */
    public function restored(UserDataCollection $userDataCollection): void
    {
        Log::info('UserDataCollection restored', [
            'id' => $userDataCollection->id,
            'user_id' => $userDataCollection->user_id,
        ]);
    }

    /**
     * Handle the UserDataCollection "force deleted" event.
     */
    public function forceDeleted(UserDataCollection $userDataCollection): void
    {
        Log::info('UserDataCollection force deleted', [
            'id' => $userDataCollection->id,
            'user_id' => $userDataCollection->user_id,
        ]);
    }
}
