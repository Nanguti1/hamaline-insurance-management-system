<?php

namespace App\Http\Requests\Underwriters;

use App\Models\Underwriter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnderwriterRequest extends FormRequest
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
        /** @var Underwriter|null $underwriter */
        $underwriter = $this->route('underwriter');
        $underwriterId = $underwriter?->getKey();

        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                Rule::unique('underwriters', 'email')->ignore($underwriterId),
            ],
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

