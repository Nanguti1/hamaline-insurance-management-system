<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class RiskNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'line_type',
        'risk_note_number',
        'client_id',
        'underwriter_id',
        'insurer_id',
        'status',
        'submitted_at',
        'decided_at',
        'cancelled_at',
        'start_date',
        'end_date',
        'premium_amount',
        'currency',
        'notes',
        'risk_note_content',
        'policy_id',
        'created_by',
        'updated_by',
        'approved_by',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'decided_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
        'premium_amount' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function underwriter(): BelongsTo
    {
        return $this->belongsTo(Underwriter::class, 'underwriter_id');
    }

    public function insurer(): BelongsTo
    {
        return $this->belongsTo(Insurer::class, 'insurer_id');
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'policy_id');
    }

    public function medicalDetails(): HasOne
    {
        // medical_risk_note_details uses risk_note_id as PK
        return $this->hasOne(MedicalRiskNoteDetails::class, 'risk_note_id', 'id');
    }

    public function medicalMembers(): HasMany
    {
        return $this->hasMany(MedicalMember::class, 'risk_note_id', 'id');
    }

    public function motorDetails(): HasOne
    {
        return $this->hasOne(MotorRiskNoteDetails::class, 'risk_note_id', 'id');
    }

    public function wibaEmployees(): HasMany
    {
        return $this->hasMany(WibaEmployee::class, 'risk_note_id', 'id');
    }

    public function underwritingDecisions(): HasMany
    {
        return $this->hasMany(RiskNoteUnderwritingDecision::class, 'risk_note_id', 'id');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
