<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalMemberBenefit extends Model
{
    use HasFactory;

    protected $fillable = [
        'medical_member_id',
        'benefit_type',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(MedicalMember::class, 'medical_member_id');
    }
}

