<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WithdrawalSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'auto_approve_threshold',
        'min_withdrawal',
        'max_withdrawal',
        'fee_percentage',
        'fee_fixed',
    ];

    protected $casts = [
        'auto_approve_threshold' => 'decimal:2',
        'min_withdrawal' => 'decimal:2',
        'max_withdrawal' => 'decimal:2',
        'fee_percentage' => 'decimal:2',
        'fee_fixed' => 'decimal:2',
    ];

    /**
     * Get the singleton instance of withdrawal settings.
     */
    public static function getSettings(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'auto_approve_threshold' => 1000000, // 1 triệu VND
                'min_withdrawal' => 50000, // 50k VND
                'max_withdrawal' => 100000000, // 100 triệu VND
                'fee_percentage' => 0,
                'fee_fixed' => 0,
            ]
        );
    }

    /**
     * Calculate withdrawal fee.
     */
    public function calculateFee(float $amount): float
    {
        $percentageFee = ($amount * $this->fee_percentage) / 100;
        return $percentageFee + $this->fee_fixed;
    }

    /**
     * Check if amount can be auto-approved.
     */
    public function canAutoApprove(float $amount): bool
    {
        return $amount <= $this->auto_approve_threshold;
    }

    /**
     * Validate withdrawal amount.
     */
    public function validateAmount(float $amount): array
    {
        $errors = [];

        if ($amount < $this->min_withdrawal) {
            $errors[] = "Số tiền rút tối thiểu là " . number_format($this->min_withdrawal, 0, ',', '.') . " VND";
        }

        if ($amount > $this->max_withdrawal) {
            $errors[] = "Số tiền rút tối đa là " . number_format($this->max_withdrawal, 0, ',', '.') . " VND";
        }

        return $errors;
    }
}
