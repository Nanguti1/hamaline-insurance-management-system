<?php

namespace App\Http\Requests\Reports;

use App\Models\ReportRun;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportRunRequest extends FormRequest
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
        /** @var ReportRun|null $reportRun */
        $reportRun = $this->route('reportRun');
        $reportRunId = $reportRun?->getKey();

        // No unique fields, but keeping this for future constraints.
        return [
            'report_type' => ['required', Rule::in(['overview'])],
            'title' => ['required', 'string', 'max:255'],
            'range_start' => ['nullable', 'date'],
            'range_end' => ['nullable', 'date', 'after_or_equal:range_start'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

