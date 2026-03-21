<?php

namespace App\Http\Requests\Commissions;

use App\Models\Commission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommissionRequest extends FormRequest
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

