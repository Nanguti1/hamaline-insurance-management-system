<?php

namespace App\Http\Requests\RiskNotes;

use Illuminate\Foundation\Http\FormRequest;

class AssignMedicalMemberNumbersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'members' => ['required', 'array', 'min:1'],
            'members.*.id' => ['required', 'integer'],
            'members.*.member_number' => ['required', 'string', 'min:1', 'max:50'],
        ];
    }
}
