<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MotorPolicyDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_id',
        'binder_version_id',
        'vehicle_use',
        'cover_type',
        'private_use_class',
        'commercial_class',
        'cover_plan',
        'cover_addons',
        'capacity',
        'capacity_unit',
        'registration_number',
        'vehicle_make',
        'vehicle_model',
        'year_of_manufacture',
        'vehicle_value',
        'vehicle_color',
        'chassis_number',
        'engine_number',
        'carriage_capacity',
        'engine_size',
        'insurer_policy_number',
        'internal_policy_number',
        'customer_id',
        'mobile_number',
        'telephone_other',
        'postal_code',
        'country',
        'bank_account_number',
        'branch_code',
        'pin_number',
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
        'notes',
    ];

    protected $casts = [
        'vehicle_use' => 'string',
        'binder_version_id' => 'integer',
        'cover_type' => 'string',
        'private_use_class' => 'string',
        'commercial_class' => 'string',
        'cover_plan' => 'string',
        'cover_addons' => 'array',
        'capacity' => 'decimal:2',
        'capacity_unit' => 'string',
        'registration_number' => 'string',
        'vehicle_make' => 'string',
        'vehicle_model' => 'string',
        'year_of_manufacture' => 'integer',
        'vehicle_value' => 'decimal:2',
        'vehicle_color' => 'string',
        'chassis_number' => 'string',
        'engine_number' => 'string',
        'carriage_capacity' => 'decimal:2',
        'engine_size' => 'string',
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

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function binderVersion(): BelongsTo
    {
        return $this->belongsTo(BinderVersion::class);
    }
}
