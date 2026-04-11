<?php

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientMedicalCategoryRequest extends FormRequest
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
            'category_code' => ['required', 'string', 'max:10', 'in:A,B,C,D,E,F'],
            'category_name' => ['required', 'string', 'max:100'],
            'category_identifier' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
