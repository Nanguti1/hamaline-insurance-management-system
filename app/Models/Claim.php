<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Claim extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_id',
        'assigned_to',
        'created_by',
        'updated_by',
        'approved_by',
        'claim_number',
        'claimant_name',
        'loss_date',
        'reported_at',
        'claim_amount',
        'currency',
        'status',
        'notes',
    ];

    protected $casts = [
        'loss_date' => 'date',
        'reported_at' => 'date',
        'claim_amount' => 'decimal:2',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'policy_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
