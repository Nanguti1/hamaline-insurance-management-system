<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Insurer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function underwriters(): BelongsToMany
    {
        return $this->belongsToMany(Underwriter::class, 'insurer_underwriter', 'insurer_id', 'underwriter_id')
            ->withTimestamps();
    }
}
