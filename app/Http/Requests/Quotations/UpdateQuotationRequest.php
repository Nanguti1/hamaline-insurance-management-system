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
                'min:2',
                'max:10',
                'required_if:payment_plan,installments',
            ],
            'vehicle_class' => ['nullable', 'string', 'max:100'],
            'vehicle_make_model' => ['nullable', 'string', 'max:150'],
            'year_of_manufacture' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'registration_number' => ['nullable', 'string', 'max:50'],
            'sum_insured' => ['nullable', 'numeric', 'min:0'],
            'quoted_base_premium' => ['nullable', 'numeric', 'min:0'],
            'quoted_training_levy' => ['nullable', 'numeric', 'min:0'],
            'quoted_phcf' => ['nullable', 'numeric', 'min:0'],
            'quoted_stamp_duty' => ['nullable', 'numeric', 'min:0'],
            'quoted_total_premium' => ['nullable', 'numeric', 'min:0'],
            'interests_insured' => ['nullable', 'string'],
            'excess_remarks' => ['nullable', 'string'],
            'prepared_by' => ['nullable', 'string', 'max:150'],
            'reviewed_by' => ['nullable', 'string', 'max:150'],
            'quoted_on' => ['nullable', 'date'],
        ];
    }
}
