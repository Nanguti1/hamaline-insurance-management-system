<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'underwriter_id',
        'created_by',
        'updated_by',
        'approved_by',
        'quotation_number',
        'status',
        'premium_amount',
        'currency',
        'valid_until',
        'notes',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'premium_amount' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function underwriter(): BelongsTo
    {
        return $this->belongsTo(Underwriter::class, 'underwriter_id');
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

    public function policies(): HasMany
    {
        return $this->hasMany('App\\Models\\Policy', 'quotation_id');
    }
}
