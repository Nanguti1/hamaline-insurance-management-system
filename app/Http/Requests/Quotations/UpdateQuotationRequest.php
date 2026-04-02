<?php

namespace App\Http\Requests\Quotations;

use App\Http\Requests\Concerns\ValidatesUnderwriterBelongsToUser;
use App\Models\Quotation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuotationRequest extends FormRequest
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
        /** @var Quotation|null $quotation */
        $quotation = $this->route('quotation');
        $quotationId = $quotation?->getKey();

        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'insurer_id' => ['required', 'integer', 'exists:insurers,id'],
            'quotation_number' => ['required', 'string', 'max:50', Rule::unique('quotations', 'quotation_number')->ignore($quotationId)],
            'status' => ['required', Rule::in(['draft', 'issued', 'approved', 'rejected', 'expired'])],
            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'valid_until' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'policy_type' => ['required', 'string', Rule::in(['motor', 'medical', 'wiba'])],
            'payment_plan' => ['required', Rule::in(['one_off', 'installments'])],
            'installment_count' => [
                'nullable',
                'integer',
                Rule::in([4]),
                'required_if:payment_plan,installments',
            ],
        ];
    }
}
