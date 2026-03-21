<?php

namespace App\Http\Requests\Renewals;

use App\Models\Renewal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRenewalRequest extends FormRequest
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
        /** @var Renewal|null $renewal */
        $renewal = $this->route('renewal');
        $renewalId = $renewal?->getKey();

        return [
            'policy_id' => ['required', 'integer', 'exists:policies,id'],
            'renewal_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('renewals', 'renewal_number')->ignore($renewalId),
            ],
            'status' => ['required', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'renewal_date' => ['required', 'date'],
            'new_end_date' => ['nullable', 'date'],
            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

