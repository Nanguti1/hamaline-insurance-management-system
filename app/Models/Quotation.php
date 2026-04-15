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
        'insurer_id',
        'created_by',
        'updated_by',
        'approved_by',
        'quotation_number',
        'status',
        'premium_amount',
        'currency',
        'valid_until',
        'notes',
        'policy_type',
        'payment_plan',
        'installment_count',
        'vehicle_class',
        'vehicle_make_model',
        'year_of_manufacture',
        'registration_number',
        'sum_insured',
        'quoted_base_premium',
        'quoted_training_levy',
        'quoted_phcf',
        'quoted_stamp_duty',
        'quoted_total_premium',
        'interests_insured',
        'excess_remarks',
        'prepared_by',
        'reviewed_by',
        'quoted_on',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'premium_amount' => 'decimal:2',
        'installment_count' => 'integer',
        'sum_insured' => 'decimal:2',
        'quoted_base_premium' => 'decimal:2',
        'quoted_training_levy' => 'decimal:2',
        'quoted_phcf' => 'decimal:2',
        'quoted_stamp_duty' => 'decimal:2',
        'quoted_total_premium' => 'decimal:2',
        'quoted_on' => 'date',
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
