<?php

namespace App\Http\Requests\Quotations;

use App\Models\Quotation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuotationRequest extends FormRequest
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
        /** @var Quotation|null $quotation */
        $quotation = $this->route('quotation');
        $quotationId = $quotation?->getKey();

        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'quotation_number' => ['required', 'string', 'max:50', Rule::unique('quotations', 'quotation_number')->ignore($quotationId)],
            'status' => ['required', Rule::in(['draft', 'issued', 'approved', 'rejected', 'expired'])],
            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'valid_until' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

