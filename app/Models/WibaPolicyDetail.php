<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WibaPolicyDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_id',
        'notes',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(PolicyMember::class, 'policy_id', 'policy_id');
    }
}
