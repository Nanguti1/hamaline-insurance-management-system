<?php

namespace App\Http\Requests\Payments;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentRequest extends FormRequest
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
        /** @var Payment|null $payment */
        $payment = $this->route('payment');
        $paymentId = $payment?->getKey();

        return [
            'policy_id' => ['required', 'integer', 'exists:policies,id'],
            'payment_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('payments', 'payment_number')->ignore($paymentId),
            ],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'method' => ['required', 'string', 'max:30'],
            'status' => ['required', Rule::in(['pending', 'received', 'reversed'])],
            'paid_at' => ['nullable', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

