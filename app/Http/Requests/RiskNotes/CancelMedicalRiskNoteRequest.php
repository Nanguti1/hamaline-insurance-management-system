<?php

namespace App\Http\Requests\RiskNotes;

use Illuminate\Foundation\Http\FormRequest;

class CancelMedicalRiskNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

