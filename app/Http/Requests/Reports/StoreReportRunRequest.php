<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRunRequest extends FormRequest
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
        $reportTypes = [
            'overview',
            'policies_by_type',
            'active_vs_cancelled_policies',
            'claims_summary',
            'premium_collected',
            'corporate_employee_coverage',
            'underwriter_performance',
        ];

        return [
            'report_type' => ['required', Rule::in($reportTypes)],
            'title' => ['required', 'string', 'max:255'],
            'range_start' => ['nullable', 'date'],
            'range_end' => ['nullable', 'date', 'after_or_equal:range_start'],

            'client_type' => ['nullable', Rule::in(['individual', 'corporate'])],
            'policy_type' => ['nullable', Rule::in(['medical', 'motor', 'wiba'])],
            'status' => ['nullable', Rule::in(['pending', 'active', 'cancelled', 'lapsed', 'expired', 'renewed'])],

            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

