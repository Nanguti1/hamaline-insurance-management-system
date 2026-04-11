<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskNoteUnderwritingDecision extends Model
{
    use HasFactory;

    protected $fillable = [
        'risk_note_id',
        'underwriter_id',
        'decided_by',
        'decision',
        'decision_notes',
        'decided_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    public function riskNote(): BelongsTo
    {
        return $this->belongsTo(RiskNote::class, 'risk_note_id');
    }

    public function decidedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
