<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BinderVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'binder_id',
        'version_number',
        'is_active',
        'signed_on',
        'summary_of_cover',
        'limits_liability',
        'special_clauses',
        'exclusions',
        'premium_rules',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'signed_on' => 'date',
        'limits_liability' => 'array',
        'special_clauses' => 'array',
        'exclusions' => 'array',
        'premium_rules' => 'array',
    ];

    public function binder(): BelongsTo
    {
        return $this->belongsTo(Binder::class);
    }

    public function motorPolicyDetails(): HasMany
    {
        return $this->hasMany(MotorPolicyDetail::class);
    }
}

