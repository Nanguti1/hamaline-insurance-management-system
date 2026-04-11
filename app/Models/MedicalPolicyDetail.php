<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalPolicyDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_id',
        'medical_category',
        'benefits',
        'notes',
        'outpatient_benefit',
        'outpatient_amount',
        'inpatient_benefit',
        'inpatient_amount',
        'optical_benefit',
        'optical_amount',
        'maternity_benefit',
        'maternity_amount',
    ];

    protected $casts = [
        'medical_category' => 'string',
        'benefits' => 'array',
        'outpatient_benefit' => 'boolean',
        'inpatient_benefit' => 'boolean',
        'optical_benefit' => 'boolean',
        'maternity_benefit' => 'boolean',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(PolicyMember::class, 'policy_id', 'policy_id');
    }
}
