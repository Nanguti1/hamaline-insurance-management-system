<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Policy extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'underwriter_id',
        'insurer_id',
        'quotation_id',
        'created_by',
        'updated_by',
        'approved_by',
        'policy_number',
        'policy_type',
        'status',
        'start_date',
        'end_date',
        'premium_amount',
        'currency',
        'notes',
        'risk_note_content',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'premium_amount' => 'decimal:2',
        'quotation_id' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function underwriter(): BelongsTo
    {
        return $this->belongsTo(Underwriter::class, 'underwriter_id');
    }

    public function insurer(): BelongsTo
    {
        return $this->belongsTo(Insurer::class, 'insurer_id');
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo('App\\Models\\Quotation', 'quotation_id');
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

    public function payments(): HasMany
    {
        return $this->hasMany('App\\Models\\Payment', 'policy_id');
    }

    public function claims(): HasMany
    {
        return $this->hasMany('App\\Models\\Claim', 'policy_id');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany('App\\Models\\Commission', 'policy_id');
    }

    public function renewals(): HasMany
    {
        return $this->hasMany('App\\Models\\Renewal', 'policy_id');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function riskNotes(): HasMany
    {
        return $this->hasMany(RiskNote::class, 'policy_id');
    }
}
