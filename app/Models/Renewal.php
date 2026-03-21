<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Renewal extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_id',
        'renewal_number',
        'status',
        'renewal_date',
        'new_end_date',
        'premium_amount',
        'currency',
        'notes',
    ];

    protected $casts = [
        'renewal_date' => 'date',
        'new_end_date' => 'date',
        'premium_amount' => 'decimal:2',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'policy_id');
    }
}

