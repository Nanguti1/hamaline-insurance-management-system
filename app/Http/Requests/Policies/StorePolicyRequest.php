<?php

namespace App\Http\Requests\Policies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'quotation_id' => ['nullable', 'integer', 'exists:quotations,id'],
            'policy_number' => ['required', 'string', 'max:50', 'unique:policies,policy_number'],
            'policy_type' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'lapsed', 'cancelled', 'expired', 'renewed'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

