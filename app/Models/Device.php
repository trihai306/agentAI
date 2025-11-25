<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Device extends Model
{
    protected $fillable = [
        'udid',
        'name',
        'model',
        'platform',
        'version',
        'status',
        'screen_size',
        'orientation',
        'user_id',
        'is_active',
        'last_seen_at',
        'metadata',
    ];

    protected $casts = [
        'screen_size' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    /**
     * Get the user that owns the device.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if device is currently connected.
     */
    public function isConnected(): bool
    {
        return $this->status === 'device' && $this->is_active;
    }

    /**
     * Check if device is offline.
     */
    public function isOffline(): bool
    {
        return $this->status === 'offline' ||
               ($this->last_seen_at && $this->last_seen_at->lt(Carbon::now()->subMinutes(5)));
    }

    /**
     * Get platform display name.
     */
    public function getPlatformDisplayAttribute(): string
    {
        return match($this->platform) {
            'android' => 'Android',
            'ios' => 'iOS',
            default => 'Unknown',
        };
    }

    /**
     * Get status display name.
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'device' => 'Đã kết nối',
            'offline' => 'Ngắt kết nối',
            'unauthorized' => 'Chưa ủy quyền',
            default => 'Không xác định',
        };
    }

    /**
     * Get screen size as string.
     */
    public function getScreenSizeDisplayAttribute(): string
    {
        if (!$this->screen_size || !is_array($this->screen_size)) {
            return '-';
        }

        $width = $this->screen_size['width'] ?? '?';
        $height = $this->screen_size['height'] ?? '?';

        return "{$width} × {$height}";
    }

    /**
     * Scope for connected devices.
     */
    public function scopeConnected($query)
    {
        return $query->where('status', 'device')->where('is_active', true);
    }

    /**
     * Scope for active devices.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for platform.
     */
    public function scopePlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }
}
