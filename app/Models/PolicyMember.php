<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_id',
        'name',
        'payroll_number',
        'id_number',
        'phone',
        'annual_salary',
        'relationship',
        'date_of_birth',
        'gender',
        'notes',
    ];

    protected $casts = [
        'annual_salary' => 'decimal:2',
        'date_of_birth' => 'date',
        'gender' => 'string',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }
}
