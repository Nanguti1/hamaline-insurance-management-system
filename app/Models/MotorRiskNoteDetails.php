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
        'insurer_policy_number',
        'internal_policy_number',
        'binder_name',
        'customer_id',
        'mobile_number',
        'telephone_other',
        'postal_code',
        'country',
        'bank_account_number',
        'branch_code',
        'pin_number',

        'registration_number',
        'make_model',
        'year_of_manufacture',
        'chassis_number',
        'engine_number',
        'body_type',
        'vehicle_use',

        'cover_type',
        'sum_insured',
        'time_on_risk_start_date',
        'time_on_risk_end_date',
        'passenger_count',
        'logbook_status',
        'accessories_value',
        'windscreen_value',
        'radio_value',
        'limits_liability',
        'excess_rules',
        'applicable_clauses',
        'exclusions',
        'time_on_risk_premium',
        'policyholders_fund',
        'training_levy',
        'first_premium_total',
        'time_on_risk_total_premium',
        'payment_method',
        'payment_plan_type',
        'installment_count',
        'installment_amount',
        'issuing_officer_name',
        'verifying_officer_name',
        'issued_on',
    ];

    protected $casts = [
        'year_of_manufacture' => 'integer',
        'sum_insured' => 'decimal:2',
        'time_on_risk_start_date' => 'date',
        'time_on_risk_end_date' => 'date',
        'passenger_count' => 'integer',
        'accessories_value' => 'decimal:2',
        'windscreen_value' => 'decimal:2',
        'radio_value' => 'decimal:2',
        'limits_liability' => 'array',
        'excess_rules' => 'array',
        'applicable_clauses' => 'array',
        'exclusions' => 'array',
        'time_on_risk_premium' => 'decimal:2',
        'policyholders_fund' => 'decimal:2',
        'training_levy' => 'decimal:2',
        'first_premium_total' => 'decimal:2',
        'time_on_risk_total_premium' => 'decimal:2',
        'installment_count' => 'integer',
        'installment_amount' => 'decimal:2',
        'issued_on' => 'date',
    ];

    public function riskNote(): BelongsTo
    {
        return $this->belongsTo(RiskNote::class, 'risk_note_id', 'id');
    }
}
