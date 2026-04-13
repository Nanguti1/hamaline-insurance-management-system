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
            'insurer_policy_number' => ['nullable', 'string', 'max:80'],
            'internal_policy_number' => ['nullable', 'string', 'max:80'],
            'binder_name' => ['nullable', 'string', 'max:255'],
            'customer_id' => ['nullable', 'string', 'max:80'],
            'mobile_number' => ['nullable', 'string', 'max:50'],
            'telephone_other' => ['nullable', 'string', 'max:50'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:80'],
            'bank_account_number' => ['nullable', 'string', 'max:80'],
            'branch_code' => ['nullable', 'string', 'max:50'],
            'pin_number' => ['nullable', 'string', 'max:50'],

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
            'time_on_risk_start_date' => ['nullable', 'date'],
            'time_on_risk_end_date' => ['nullable', 'date', 'after_or_equal:time_on_risk_start_date'],
            'passenger_count' => ['nullable', 'integer', 'min:1'],
            'logbook_status' => ['nullable', 'string', 'max:50'],
            'accessories_value' => ['nullable', 'numeric', 'min:0'],
            'windscreen_value' => ['nullable', 'numeric', 'min:0'],
            'radio_value' => ['nullable', 'numeric', 'min:0'],
            'limits_liability' => ['nullable', 'array'],
            'excess_rules' => ['nullable', 'array'],
            'applicable_clauses' => ['nullable', 'array'],
            'exclusions' => ['nullable', 'array'],
            'time_on_risk_premium' => ['nullable', 'numeric', 'min:0'],
            'policyholders_fund' => ['nullable', 'numeric', 'min:0'],
            'training_levy' => ['nullable', 'numeric', 'min:0'],
            'first_premium_total' => ['nullable', 'numeric', 'min:0'],
            'time_on_risk_total_premium' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'issuing_officer_name' => ['nullable', 'string', 'max:255'],
            'verifying_officer_name' => ['nullable', 'string', 'max:255'],
            'issued_on' => ['nullable', 'date'],
        ];
    }
}
