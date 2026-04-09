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
        'capacity',
        'capacity_unit',
        'vehicle_model',
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
        'capacity' => 'decimal:2',
        'capacity_unit' => 'string',
        'vehicle_model' => 'string',
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
