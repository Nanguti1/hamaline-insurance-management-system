<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'report_type',
        'title',
        'range_start',
        'range_end',
        'active_policies_count',
        'clients_count',
        'premium_total',
        'claim_total',
        'generated_at',
        'notes',
    ];

    protected $casts = [
        'range_start' => 'date',
        'range_end' => 'date',
        'generated_at' => 'datetime',
        'premium_total' => 'decimal:2',
        'claim_total' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

