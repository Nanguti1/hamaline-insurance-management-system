<?php

namespace App\Http\Requests\RiskNotes;

use App\Http\Requests\Concerns\ValidatesUnderwriterBelongsToUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMotorRiskNoteRequest extends FormRequest
{
    use ValidatesUnderwriterBelongsToUser;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],

            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],

            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:2000'],

            // Insured details
            'insured_name' => ['required', 'string', 'max:255'],
            'insured_id_number' => ['required', 'string', 'max:50'],
            'insured_phone' => ['required', 'string', 'max:50'],
            'insured_email' => ['required', 'string', 'max:255'],
            'insured_postal_address' => ['required', 'string'],

            // Vehicle details
            'registration_number' => ['required', 'string', 'max:50'],
            'make_model' => ['required', 'string', 'max:255'],
            'year_of_manufacture' => ['required', 'integer', 'min:1900', 'max:2100'],
            'chassis_number' => ['required', 'string', 'max:100'],
            'engine_number' => ['required', 'string', 'max:100'],
            'body_type' => ['required', 'string', 'max:50'],
            'vehicle_use' => ['required', Rule::in(['private', 'commercial'])],

            // Cover
            'cover_type' => ['required', Rule::in(['third_party_only', 'third_party_fire_theft', 'comprehensive'])],
            'sum_insured' => ['required', 'numeric', 'min:0'],
        ];
    }
}
