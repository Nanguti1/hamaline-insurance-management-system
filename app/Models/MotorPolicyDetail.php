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
        'notes',
    ];

    protected $casts = [
        'vehicle_use' => 'string',
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
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }
}
