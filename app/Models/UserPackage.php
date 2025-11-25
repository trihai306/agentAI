<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class UserPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'package_id',
        'quota_used',
        'quota_total',
        'expires_at',
        'status',
        'purchased_at',
    ];

    protected $casts = [
        'quota_used' => 'integer',
        'quota_total' => 'integer',
        'expires_at' => 'datetime',
        'purchased_at' => 'datetime',
    ];

    /**
     * Get the user that owns the package.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the service package.
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class, 'package_id');
    }

    /**
     * Check if package is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && !$this->isExpired();
    }

    /**
     * Check if package is expired.
     */
    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false; // Vô thời hạn
        }
        return $this->expires_at->isPast();
    }

    /**
     * Get remaining quota.
     */
    public function getRemainingQuota(): int
    {
        return max(0, $this->quota_total - $this->quota_used);
    }

    /**
     * Use quota.
     */
    public function useQuota(int $amount): bool
    {
        if ($this->getRemainingQuota() >= $amount) {
            $this->quota_used += $amount;
            return $this->save();
        }
        return false;
    }

    /**
     * Check if can use quota.
     */
    public function canUseQuota(int $amount): bool
    {
        return $this->isActive() && $this->getRemainingQuota() >= $amount;
    }

    /**
     * Scope a query to only include active packages.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope a query to only include expired packages.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
    }
}
