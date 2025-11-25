<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display the user settings page.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Mask API keys for display (only show last 4 characters)
        $maskedApiKeys = [
            'openai' => $user->openai_api_key ? $this->maskApiKey($user->openai_api_key) : null,
            'gemini' => $user->gemini_api_key ? $this->maskApiKey($user->gemini_api_key) : null,
            'claude' => $user->claude_api_key ? $this->maskApiKey($user->claude_api_key) : null,
        ];

        return Inertia::render('User/Settings', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
            'apiKeys' => $maskedApiKeys,
        ]);
    }

    /**
     * Update user profile information.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return back()->with('success', 'Đã cập nhật thông tin tài khoản thành công.');
    }

    /**
     * Update user password.
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Mật khẩu hiện tại không đúng.'])->withInput();
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Đã cập nhật mật khẩu thành công.');
    }

    /**
     * Update API keys.
     */
    public function updateApiKeys(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'openai_api_key' => ['nullable', 'string', 'max:500'],
            'gemini_api_key' => ['nullable', 'string', 'max:500'],
            'claude_api_key' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = Auth::user();
        $updates = [];

        // Only update if new value is provided (not empty)
        if ($request->has('openai_api_key') && $request->openai_api_key !== '') {
            $updates['openai_api_key'] = trim($request->openai_api_key);
        }

        if ($request->has('gemini_api_key') && $request->gemini_api_key !== '') {
            $updates['gemini_api_key'] = trim($request->gemini_api_key);
        }

        if ($request->has('claude_api_key') && $request->claude_api_key !== '') {
            $updates['claude_api_key'] = trim($request->claude_api_key);
        }

        if (!empty($updates)) {
            $user->update($updates);
        }

        return back()->with('success', 'Đã cập nhật API keys thành công.');
    }

    /**
     * Delete an API key.
     */
    public function deleteApiKey(Request $request, string $provider)
    {
        $validProviders = ['openai', 'gemini', 'claude'];

        if (!in_array($provider, $validProviders)) {
            return back()->with('error', 'Provider không hợp lệ.');
        }

        $user = Auth::user();
        $columnName = $provider . '_api_key';

        $user->update([
            $columnName => null,
        ]);

        return back()->with('success', 'Đã xóa API key thành công.');
    }

    /**
     * Mask API key for display (show only last 4 characters).
     */
    private function maskApiKey(string $apiKey): string
    {
        if (strlen($apiKey) <= 4) {
            return str_repeat('*', strlen($apiKey));
        }

        return str_repeat('*', strlen($apiKey) - 4) . substr($apiKey, -4);
    }
}
