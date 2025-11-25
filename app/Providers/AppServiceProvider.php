<?php

namespace App\Providers;

use App\Repositories\Contracts\DeviceRepositoryInterface;
use App\Repositories\DeviceRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Repository bindings
        $this->app->bind(\App\Repositories\Contracts\DeviceRepositoryInterface::class, \App\Repositories\DeviceRepository::class);
        $this->app->bind(\App\Repositories\Contracts\UserRepositoryInterface::class, \App\Repositories\UserRepository::class);
        $this->app->bind(\App\Repositories\Contracts\TransactionRepositoryInterface::class, \App\Repositories\TransactionRepository::class);
        $this->app->bind(\App\Repositories\Contracts\ServicePackageRepositoryInterface::class, \App\Repositories\ServicePackageRepository::class);
        $this->app->bind(\App\Repositories\Contracts\RoleRepositoryInterface::class, \App\Repositories\RoleRepository::class);
        $this->app->bind(\App\Repositories\Contracts\PermissionRepositoryInterface::class, \App\Repositories\PermissionRepository::class);
        $this->app->bind(\App\Repositories\Contracts\NotificationRepositoryInterface::class, \App\Repositories\NotificationRepository::class);
        
        // User Data Management repositories
        $this->app->bind(\App\Repositories\Contracts\UserDataCollectionRepositoryInterface::class, \App\Repositories\UserDataCollectionRepository::class);
        $this->app->bind(\App\Repositories\Contracts\UserDataItemRepositoryInterface::class, \App\Repositories\UserDataItemRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register observers
        \App\Models\UserDataCollection::observe(\App\Observers\UserDataCollectionObserver::class);
        \App\Models\UserDataItem::observe(\App\Observers\UserDataItemObserver::class);
    }
}
