<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Load roles and permissions for authenticated user
        if ($user) {
            $user->load(['roles.permissions']);
        }

        // Get unread notifications count for authenticated user
        $unreadNotificationsCount = 0;
        $walletBalance = 0;
        if ($user) {
            $unreadNotificationsCount = \App\Models\Notification::where('user_id', $user->id)
                ->where('status', 'unread')
                ->count();
            
            // Get wallet balance
            $wallet = \App\Models\Wallet::where('user_id', $user->id)->first();
            if ($wallet) {
                $walletBalance = (float) $wallet->balance;
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'unreadNotificationsCount' => $unreadNotificationsCount,
            'walletBalance' => $walletBalance,
        ];
    }
}
