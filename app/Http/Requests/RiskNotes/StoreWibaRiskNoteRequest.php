<?php

namespace App\Http\Requests\RiskNotes;

use App\Http\Requests\Concerns\ValidatesUnderwriterBelongsToUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWibaRiskNoteRequest extends FormRequest
{
    use ValidatesUnderwriterBelongsToUser;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => [
                'required',
                'integer',
                Rule::exists('clients', 'id')->where(fn ($q) => $q->where('type', 'corporate')),
            ],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],

            // WIBA spec doesn't mention period/financials; keep optional.
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'premium_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:2000'],

            'employees' => ['required', 'array', 'min:1'],
            'employees.*.employee_sequence' => ['required', 'integer', 'min:0'],
            'employees.*.name' => ['required', 'string', 'max:255'],
            'employees.*.payroll_number' => ['required', 'string', 'max:50'],
            'employees.*.id_number' => ['required', 'string', 'max:50'],
            'employees.*.date_of_birth' => ['required', 'date'],
            'employees.*.annual_salary' => ['required', 'numeric', 'min:0'],
        ];
    }
}

