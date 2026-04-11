<?php

namespace App\Http\Requests\Renewals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRenewalRequest extends FormRequest
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
            'policy_id' => ['required', 'integer', 'exists:policies,id'],
            'renewal_number' => ['required', 'string', 'max:50', 'unique:renewals,renewal_number'],
            'status' => ['required', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'renewal_date' => ['required', 'date'],
            'new_end_date' => ['nullable', 'date'],
            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
