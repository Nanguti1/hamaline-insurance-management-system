<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Underwriter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'notes',
    ];

    public function quotations(): HasMany
    {
        // Related module models are implemented as part of the full system.
        return $this->hasMany('App\\Models\\Quotation', 'underwriter_id');
    }

    public function policies(): HasMany
    {
        return $this->hasMany('App\\Models\\Policy', 'underwriter_id');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany('App\\Models\\Commission', 'underwriter_id');
    }
}

