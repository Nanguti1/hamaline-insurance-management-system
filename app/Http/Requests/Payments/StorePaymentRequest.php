<?php

namespace App\Http\Requests\Payments;

use App\Models\Policy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
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
            'flow' => ['required', Rule::in(['in', 'out'])],
            'payment_number' => ['required', 'string', 'max:50', 'unique:payments,payment_number'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'method' => ['required', 'string', 'max:30'],
            'status' => ['required', Rule::in(['pending', 'received', 'reversed'])],
            'paid_at' => ['nullable', 'date'],
            'reference' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'proof' => ['required', 'file', 'max:10240'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $policyId = $this->integer('policy_id');
            if (! $policyId) {
                return;
            }

            $hasDocuments = Policy::query()
                ->whereKey($policyId)
                ->whereHas('documents')
                ->exists();

            if (! $hasDocuments) {
                $validator->errors()->add(
                    'policy_id',
                    'Upload policy documents before recording payments for this policy.'
                );
            }
        });
    }
}

