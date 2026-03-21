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
        return [
            'report_type' => ['required', Rule::in(['overview'])],
            'title' => ['required', 'string', 'max:255'],
            'range_start' => ['nullable', 'date'],
            'range_end' => ['nullable', 'date', 'after_or_equal:range_start'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

