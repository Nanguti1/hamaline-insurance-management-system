<?php

namespace App\Http\Requests\Underwriters;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnderwriterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('underwriters.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $emailRule = app()->environment(['local', 'testing']) ? 'email:rfc' : 'email:rfc,dns';

        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => [
                'required',
                $emailRule,
                'max:255',
                Rule::unique('underwriters', 'email'),
                Rule::unique('users', 'email'),
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'insurer_ids' => ['required', 'array', 'min:1'],
            'insurer_ids.*' => ['required', 'integer', 'exists:insurers,id'],
        ];
    }
}
