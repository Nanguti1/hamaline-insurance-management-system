<?php

namespace App\Http\Requests\Claims;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClaimRequest extends FormRequest
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
            'claim_number' => ['nullable', 'string', 'max:50', 'unique:claims,claim_number'],
            'claimant_name' => ['required', 'string', 'max:255'],
            'loss_date' => ['required', 'date'],
            'reported_at' => ['required', 'date'],
            'claim_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'status' => ['required', Rule::in(['submitted', 'assessing', 'approved', 'declined', 'settled'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

