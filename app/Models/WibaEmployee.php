<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WibaEmployee extends Model
{
    use HasFactory;

    protected $fillable = [
        'risk_note_id',
        'employee_sequence',
        'name',
        'payroll_number',
        'id_number',
        'date_of_birth',
        'annual_salary',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'annual_salary' => 'decimal:2',
    ];

    public function riskNote(): BelongsTo
    {
        return $this->belongsTo(RiskNote::class, 'risk_note_id');
    }
}
