<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'risk_note_id',
        'member_sequence',
        'member_number',
        'is_principal',
        'relationship',
        'name',
        'date_of_birth',
        'phone',
        'id_number',
        'birth_certificate_number',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_principal' => 'boolean',
    ];

    public function riskNote(): BelongsTo
    {
        return $this->belongsTo(RiskNote::class, 'risk_note_id');
    }

    public function benefits(): HasMany
    {
        return $this->hasMany(MedicalMemberBenefit::class, 'medical_member_id');
    }
}

