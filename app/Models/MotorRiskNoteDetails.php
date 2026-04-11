<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MotorRiskNoteDetails extends Model
{
    use HasFactory;

    protected $table = 'motor_risk_note_details';

    protected $primaryKey = 'risk_note_id';

    public $incrementing = false;

    protected $fillable = [
        'risk_note_id',

        'insured_name',
        'insured_id_number',
        'insured_phone',
        'insured_email',
        'insured_postal_address',

        'registration_number',
        'make_model',
        'year_of_manufacture',
        'chassis_number',
        'engine_number',
        'body_type',
        'vehicle_use',

        'cover_type',
        'sum_insured',
    ];

    protected $casts = [
        'year_of_manufacture' => 'integer',
        'sum_insured' => 'decimal:2',
    ];

    public function riskNote(): BelongsTo
    {
        return $this->belongsTo(RiskNote::class, 'risk_note_id', 'id');
    }
}
