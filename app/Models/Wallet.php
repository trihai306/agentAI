<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'currency',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * Get the user that owns the wallet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Deposit money to wallet.
     */
    public function deposit(float $amount): bool
    {
        $this->balance += $amount;
        return $this->save();
    }

    /**
     * Withdraw money from wallet.
     */
    public function withdraw(float $amount): bool
    {
        if ($this->canWithdraw($amount)) {
            $this->balance -= $amount;
            return $this->save();
        }
        return false;
    }

    /**
     * Check if wallet can withdraw the amount.
     */
    public function canWithdraw(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    /**
     * Get or create wallet for user.
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'currency' => 'VND']
        );
    }
}
