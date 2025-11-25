<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/', [LandingController::class, 'index'])->name('landing');

// Public routes (guest only)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

// Protected routes (authenticated only)
Route::middleware('auth')->group(function () {
    // Chat routes
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/api/chat', [ChatController::class, 'store'])->name('chat.store');
    Route::post('/api/chat/save', [ChatController::class, 'saveMessages'])->name('chat.save');
    Route::put('/api/chat/update', [ChatController::class, 'updateMessage'])->name('chat.update');
    Route::get('/api/chat/history', [ChatController::class, 'history'])->name('chat.history');
    Route::get('/api/chat/sessions', [ChatController::class, 'listSessions'])->name('chat.sessions.index');
    Route::post('/api/chat/sessions', [ChatController::class, 'createSession'])->name('chat.sessions.store');
    Route::get('/api/chat/sessions/{chatSession}', [ChatController::class, 'showSessionMessages'])->name('chat.sessions.show');
    Route::put('/api/chat/sessions/{chatSession}', [ChatController::class, 'updateSession'])->name('chat.sessions.update');
    Route::delete('/api/chat/sessions/{chatSession}', [ChatController::class, 'deleteSession'])->name('chat.sessions.delete');
    Route::delete('/api/chat/sessions/{chatSession}/messages', [ChatController::class, 'clearSessionMessages'])->name('chat.sessions.clear');
    Route::delete('/api/chat/clear', [ChatController::class, 'clear'])->name('chat.clear');

    // Admin routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');

        // User Management routes
        Route::resource('users', UserController::class);

        // Transaction Management routes
        Route::get('/transactions', [\App\Http\Controllers\Admin\TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/{transaction}', [\App\Http\Controllers\Admin\TransactionController::class, 'show'])->name('transactions.show');
        Route::post('/transactions/{transaction}/approve', [\App\Http\Controllers\Admin\TransactionController::class, 'approve'])->name('transactions.approve');
        Route::post('/transactions/{transaction}/reject', [\App\Http\Controllers\Admin\TransactionController::class, 'reject'])->name('transactions.reject');

        // Service Package Management routes
        Route::resource('packages', \App\Http\Controllers\Admin\ServicePackageController::class);

        // Withdrawal Management routes
        Route::get('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalController::class, 'index'])->name('withdrawals.index');
        Route::post('/withdrawals/{transaction}/approve', [\App\Http\Controllers\Admin\WithdrawalController::class, 'approve'])->name('withdrawals.approve');
        Route::post('/withdrawals/{transaction}/reject', [\App\Http\Controllers\Admin\WithdrawalController::class, 'reject'])->name('withdrawals.reject');
        Route::get('/withdrawals/settings', [\App\Http\Controllers\Admin\WithdrawalController::class, 'settings'])->name('withdrawals.settings');
        Route::put('/withdrawals/settings', [\App\Http\Controllers\Admin\WithdrawalController::class, 'updateSettings'])->name('withdrawals.settings.update');

        // Session Management routes
        Route::get('/sessions', [\App\Http\Controllers\Admin\SessionController::class, 'index'])->name('sessions.index');
        Route::get('/sessions/{session}', [\App\Http\Controllers\Admin\SessionController::class, 'show'])->name('sessions.show');
        Route::delete('/sessions/{session}', [\App\Http\Controllers\Admin\SessionController::class, 'destroy'])->name('sessions.destroy');

        // Message Management routes
        Route::get('/messages', [\App\Http\Controllers\Admin\MessageController::class, 'index'])->name('messages.index');
        Route::get('/messages/{message}', [\App\Http\Controllers\Admin\MessageController::class, 'show'])->name('messages.show');
        Route::delete('/messages/{message}', [\App\Http\Controllers\Admin\MessageController::class, 'destroy'])->name('messages.destroy');

        // Role Management routes
        Route::resource('roles', \App\Http\Controllers\Admin\RoleController::class);

        // Permission Management routes
        Route::resource('permissions', \App\Http\Controllers\Admin\PermissionController::class);

        // Notification Management routes
        Route::get('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'store'])->name('notifications.store');
        Route::put('/notifications/{notification}', [\App\Http\Controllers\Admin\NotificationController::class, 'update'])->name('notifications.update');
        Route::delete('/notifications/{notification}', [\App\Http\Controllers\Admin\NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::post('/notifications/{notification}/mark-read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
        Route::post('/notifications/{notification}/mark-unread', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsUnread'])->name('notifications.mark-unread');
        Route::post('/notifications/mark-all-read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::post('/notifications/bulk-delete', [\App\Http\Controllers\Admin\NotificationController::class, 'bulkDelete'])->name('notifications.bulk-delete');

        // Account Management routes
        Route::get('/accounts', [\App\Http\Controllers\Admin\AccountController::class, 'index'])->name('accounts.index');
        Route::get('/accounts/{user}', [\App\Http\Controllers\Admin\AccountController::class, 'show'])->name('accounts.show');
        Route::put('/accounts/{user}', [\App\Http\Controllers\Admin\AccountController::class, 'update'])->name('accounts.update');
        Route::delete('/accounts/{user}', [\App\Http\Controllers\Admin\AccountController::class, 'destroy'])->name('accounts.destroy');
        Route::post('/accounts/{user}/verify-email', [\App\Http\Controllers\Admin\AccountController::class, 'verifyEmail'])->name('accounts.verify-email');
        Route::post('/accounts/{user}/unverify-email', [\App\Http\Controllers\Admin\AccountController::class, 'unverifyEmail'])->name('accounts.unverify-email');
        Route::post('/accounts/{user}/reset-password', [\App\Http\Controllers\Admin\AccountController::class, 'resetPassword'])->name('accounts.reset-password');

        // Device Management routes
        Route::get('/devices', [\App\Http\Controllers\DeviceController::class, 'index'])->name('devices.index');
        Route::get('/devices/create', [\App\Http\Controllers\DeviceController::class, 'create'])->name('devices.create');
        Route::post('/devices', [\App\Http\Controllers\DeviceController::class, 'store'])->name('devices.store');
        Route::get('/devices/{id}', [\App\Http\Controllers\DeviceController::class, 'show'])->name('devices.show');
        Route::get('/devices/{id}/edit', [\App\Http\Controllers\DeviceController::class, 'edit'])->name('devices.edit');
        Route::put('/devices/{id}', [\App\Http\Controllers\DeviceController::class, 'update'])->name('devices.update');
        Route::delete('/devices/{id}', [\App\Http\Controllers\DeviceController::class, 'destroy'])->name('devices.destroy');
        Route::post('/devices/{id}/toggle-active', [\App\Http\Controllers\DeviceController::class, 'toggleActive'])->name('devices.toggle-active');
    });

    // Admin API routes
    Route::prefix('api/admin')->name('admin.')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats'])->name('stats');
        Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');
        Route::get('/transactions/stats', [\App\Http\Controllers\Admin\TransactionController::class, 'stats'])->name('transactions.stats');
        Route::get('/devices/stats', [\App\Http\Controllers\DeviceController::class, 'stats'])->name('devices.stats');
    });

    // User Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\User\DashboardController::class, 'index'])->name('dashboard');

    // User Management routes
    Route::get('/transactions', [\App\Http\Controllers\User\TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/{id}', [\App\Http\Controllers\User\TransactionController::class, 'show'])->name('transactions.show');
    Route::get('/transactions/export', [\App\Http\Controllers\User\TransactionController::class, 'export'])->name('transactions.export');

    Route::get('/devices', [\App\Http\Controllers\User\DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/create', [\App\Http\Controllers\User\DeviceController::class, 'create'])->name('devices.create');
    Route::post('/devices', [\App\Http\Controllers\User\DeviceController::class, 'store'])->name('devices.store');
    Route::get('/devices/{id}', [\App\Http\Controllers\User\DeviceController::class, 'show'])->name('devices.show');
    Route::get('/devices/{id}/edit', [\App\Http\Controllers\User\DeviceController::class, 'edit'])->name('devices.edit');
    Route::put('/devices/{id}', [\App\Http\Controllers\User\DeviceController::class, 'update'])->name('devices.update');
    Route::delete('/devices/{id}', [\App\Http\Controllers\User\DeviceController::class, 'destroy'])->name('devices.destroy');
    Route::post('/devices/{id}/toggle-active', [\App\Http\Controllers\User\DeviceController::class, 'toggleActive'])->name('devices.toggle-active');

    // User Workflow routes
    Route::get('/workflows', [\App\Http\Controllers\User\WorkflowController::class, 'index'])->name('workflows.index');
    Route::post('/workflows', [\App\Http\Controllers\User\WorkflowController::class, 'store'])->name('workflows.store');
    Route::get('/workflows/{id}', [\App\Http\Controllers\User\WorkflowController::class, 'show'])->name('workflows.show');
    Route::put('/workflows/{id}', [\App\Http\Controllers\User\WorkflowController::class, 'update'])->name('workflows.update');
    Route::delete('/workflows/{id}', [\App\Http\Controllers\User\WorkflowController::class, 'destroy'])->name('workflows.destroy');
    Route::post('/workflows/{id}/duplicate', [\App\Http\Controllers\User\WorkflowController::class, 'duplicate'])->name('workflows.duplicate');
    Route::post('/workflows/{id}/mark-used', [\App\Http\Controllers\User\WorkflowController::class, 'markAsUsed'])->name('workflows.mark-used');

    // API Workflow routes (for AJAX calls from frontend)
    Route::get('/api/workflows', [\App\Http\Controllers\User\WorkflowController::class, 'index'])->name('api.workflows.index');
    Route::post('/api/workflows', [\App\Http\Controllers\User\WorkflowController::class, 'store'])->name('api.workflows.store');
    Route::get('/api/workflows/{id}', [\App\Http\Controllers\User\WorkflowController::class, 'show'])->name('api.workflows.show');
    Route::put('/api/workflows/{id}', [\App\Http\Controllers\User\WorkflowController::class, 'update'])->name('api.workflows.update');
    Route::delete('/api/workflows/{id}', [\App\Http\Controllers\User\WorkflowController::class, 'destroy'])->name('api.workflows.destroy');
    Route::get('/api/workflows/public', [\App\Http\Controllers\User\WorkflowController::class, 'public'])->name('api.workflows.public');

    // User Wallet routes
    Route::get('/wallet', [\App\Http\Controllers\WalletController::class, 'show'])->name('wallet.show');
    Route::get('/wallet/deposit', [\App\Http\Controllers\WalletController::class, 'deposit'])->name('wallet.deposit');
    Route::post('/wallet/deposit', [\App\Http\Controllers\WalletController::class, 'processDeposit'])->name('wallet.deposit.process');
    Route::get('/wallet/withdraw', [\App\Http\Controllers\WalletController::class, 'withdraw'])->name('wallet.withdraw');
    Route::post('/wallet/withdraw', [\App\Http\Controllers\WalletController::class, 'processWithdraw'])->name('wallet.withdraw.process');
    Route::get('/wallet/history', [\App\Http\Controllers\WalletController::class, 'history'])->name('wallet.history');

    // User Package routes
    Route::get('/packages', [\App\Http\Controllers\ServicePackageController::class, 'index'])->name('packages.index');
    Route::post('/packages/{package}/purchase', [\App\Http\Controllers\ServicePackageController::class, 'purchase'])->name('packages.purchase');
    Route::get('/packages/my-packages', [\App\Http\Controllers\ServicePackageController::class, 'myPackages'])->name('packages.my-packages');

    // User Notification routes
    Route::get('/api/notifications', [\App\Http\Controllers\User\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/api/notifications/{id}/read', [\App\Http\Controllers\User\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::post('/api/notifications/read-all', [\App\Http\Controllers\User\NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');

    // User Data Management routes
    Route::prefix('data')->name('user.data.')->group(function () {
        Route::get('/', [\App\Http\Controllers\UserDataController::class, 'index'])->name('index');
        Route::get('/statistics', [\App\Http\Controllers\UserDataController::class, 'statistics'])->name('statistics');
        Route::get('/create', [\App\Http\Controllers\UserDataController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\UserDataController::class, 'store'])->name('store');
        Route::get('/{id}', [\App\Http\Controllers\UserDataController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [\App\Http\Controllers\UserDataController::class, 'edit'])->name('edit');
        Route::put('/{id}', [\App\Http\Controllers\UserDataController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\UserDataController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/duplicate', [\App\Http\Controllers\UserDataController::class, 'duplicate'])->name('duplicate');

        // Export/Import routes
        Route::get('/{id}/export/json', [\App\Http\Controllers\UserDataController::class, 'exportJson'])->name('export.json');
        Route::get('/{id}/export/csv', [\App\Http\Controllers\UserDataController::class, 'exportCsv'])->name('export.csv');
        Route::post('/import/json', [\App\Http\Controllers\UserDataController::class, 'importJson'])->name('import.json');
        Route::post('/import/csv', [\App\Http\Controllers\UserDataController::class, 'importCsv'])->name('import.csv');

        // Bulk operations routes
        Route::post('/bulk-delete', [\App\Http\Controllers\UserDataController::class, 'bulkDelete'])->name('bulk-delete');
        Route::post('/bulk-toggle-status', [\App\Http\Controllers\UserDataController::class, 'bulkToggleStatus'])->name('bulk-toggle-status');
        Route::get('/bulk-export/json', [\App\Http\Controllers\UserDataController::class, 'bulkExportJson'])->name('bulk-export.json');
        Route::get('/bulk-export/csv', [\App\Http\Controllers\UserDataController::class, 'bulkExportCsv'])->name('bulk-export.csv');

        // Item routes
        Route::post('/{collectionId}/items', [\App\Http\Controllers\UserDataController::class, 'storeItem'])->name('items.store');
        Route::put('/items/{itemId}', [\App\Http\Controllers\UserDataController::class, 'updateItem'])->name('items.update');
        Route::delete('/items/{itemId}', [\App\Http\Controllers\UserDataController::class, 'destroyItem'])->name('items.destroy');
        Route::post('/{collectionId}/items/bulk-import', [\App\Http\Controllers\UserDataController::class, 'bulkImportItems'])->name('items.bulk-import');
        Route::post('/{collectionId}/items/bulk-create', [\App\Http\Controllers\UserDataController::class, 'bulkCreateItems'])->name('items.bulk-create');
        Route::post('/{collectionId}/items/validate-bulk', [\App\Http\Controllers\UserDataController::class, 'validateBulkItems'])->name('items.validate-bulk');
        Route::post('/{collectionId}/items/bulk-delete', [\App\Http\Controllers\UserDataController::class, 'bulkDeleteItems'])->name('items.bulk-delete');
        Route::post('/{collectionId}/items/reorder', [\App\Http\Controllers\UserDataController::class, 'reorderItems'])->name('items.reorder');
        Route::get('/{collectionId}/items/statistics', [\App\Http\Controllers\UserDataController::class, 'itemStatistics'])->name('items.statistics');
    });

    // User Data API routes
    Route::prefix('api/data')->name('api.user.data.')->group(function () {
        Route::get('/statistics', [\App\Http\Controllers\UserDataController::class, 'getStatistics'])->name('statistics');
    });

    // User Data API routes (for workflow integration)
    Route::prefix('api/data')->name('api.user.data.')->group(function () {
        Route::get('/collections/{id}/workflow', [\App\Http\Controllers\UserDataController::class, 'getForWorkflow'])->name('workflow');
        Route::get('/collections/type/{type}/workflow', [\App\Http\Controllers\UserDataController::class, 'getByTypeForWorkflow'])->name('workflow.by-type');
        Route::get('/collections/most-used', [\App\Http\Controllers\UserDataController::class, 'mostUsed'])->name('most-used');
        Route::get('/collections/recent', [\App\Http\Controllers\UserDataController::class, 'recent'])->name('recent');
        Route::get('/collections/search', [\App\Http\Controllers\UserDataController::class, 'search'])->name('search');
    });

    // User Settings routes
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [\App\Http\Controllers\User\SettingsController::class, 'index'])->name('index');
        Route::put('/profile', [\App\Http\Controllers\User\SettingsController::class, 'updateProfile'])->name('profile.update');
        Route::put('/password', [\App\Http\Controllers\User\SettingsController::class, 'updatePassword'])->name('password.update');
        Route::put('/api-keys', [\App\Http\Controllers\User\SettingsController::class, 'updateApiKeys'])->name('api-keys.update');
        Route::delete('/api-keys/{provider}', [\App\Http\Controllers\User\SettingsController::class, 'deleteApiKey'])->name('api-keys.delete');
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// Note: Mobile/Device operations are handled directly by frontend connecting to agent-bridge
// Frontend should call agent-bridge directly at http://127.0.0.1:3001 and ws://127.0.0.1:3002
