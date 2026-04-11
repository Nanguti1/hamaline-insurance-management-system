<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalRiskNoteDetails extends Model
{
    use HasFactory;

    protected $table = 'medical_risk_note_details';

    protected $primaryKey = 'risk_note_id';

    public $incrementing = false;

    protected $fillable = [
        'risk_note_id',
        'plan_type',
        'corporate_category_code',
        'junior_children_count',
    ];

    public function riskNote(): BelongsTo
    {
        return $this->belongsTo(RiskNote::class, 'risk_note_id');
    }
}
