<?php

namespace App\Http\Requests\Commissions;

use App\Models\Commission;
use App\Models\Policy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $policyId = (int) $this->input('policy_id');
        if ($policyId <= 0) {
            return;
        }

        $policy = Policy::query()->find($policyId);
        if (! $policy) {
            return;
        }

        $this->merge([
            'percentage' => 10,
            'amount' => round((float) $policy->premium_amount * 0.1, 2),
            'currency' => $policy->currency,
            'underwriter_id' => $policy->underwriter_id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Commission|null $commission */
        $commission = $this->route('commission');
        $commissionId = $commission?->getKey();

        return [
            'policy_id' => ['required', 'integer', 'exists:policies,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'commission_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('commissions', 'commission_number')->ignore($commissionId),
            ],
            'percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'status' => ['required', Rule::in(['pending', 'paid', 'cancelled'])],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date', 'after_or_equal:period_start'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

