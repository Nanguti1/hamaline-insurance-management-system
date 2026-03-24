<?php

namespace App\Http\Requests\Policies;

use App\Http\Requests\Concerns\ValidatesUnderwriterBelongsToUser;
use App\Models\Policy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePolicyRequest extends FormRequest
{
    use ValidatesUnderwriterBelongsToUser;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Policy|null $policy */
        $policy = $this->route('policy');
        $policyId = $policy?->getKey();

        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'quotation_id' => ['nullable', 'integer', 'exists:quotations,id'],
            'policy_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('policies', 'policy_number')->ignore($policyId),
            ],
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
