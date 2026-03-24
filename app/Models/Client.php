<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'name',
        'company_name',
        'id_number',
        'registration_number',
        'kra_pin',
        'phone',
        'email',
        'address',
        'notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function policies(): HasMany
    {
        // Related module models will be implemented later.
        return $this->hasMany('App\\Models\\Policy', 'client_id');
    }

    public function quotations(): HasMany
    {
        // Related module models will be implemented later.
        return $this->hasMany('App\\Models\\Quotation', 'client_id');
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->type === 'individual'
            ? (string) $this->name
            : (string) $this->company_name;
    }

    public function getIdentifierAttribute(): ?string
    {
        return $this->type === 'individual'
            ? $this->id_number
            : $this->registration_number;
    }
}
