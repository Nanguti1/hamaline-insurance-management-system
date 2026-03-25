<?php

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
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
        $emailRule = app()->environment(['local', 'testing']) ? 'email:rfc' : 'email:rfc,dns';

        return [
            'type' => ['required', Rule::in(['individual', 'corporate'])],

            'name' => ['nullable', 'string', 'max:255', 'required_if:type,individual'],
            'id_number' => [
                'nullable',
                'string',
                'max:50',
                'required_if:type,individual',
                'unique:clients,id_number',
            ],

            'company_name' => ['nullable', 'string', 'max:255', 'required_if:type,corporate'],
            'registration_number' => [
                'nullable',
                'string',
                'max:50',
                'required_if:type,corporate',
                'unique:clients,registration_number',
            ],

            'kra_pin' => ['nullable', 'string', 'max:50'],

            'phone' => ['required', 'string', 'max:50'],
            'email' => ['required', $emailRule, 'max:255', 'unique:clients,email'],
            'address' => ['required', 'string', 'max:1000'],

            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

