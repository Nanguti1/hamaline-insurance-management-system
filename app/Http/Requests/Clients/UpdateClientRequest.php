<?php

namespace App\Http\Requests\Clients;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
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
        /** @var Client|null $client */
        $client = $this->route('client');

        $clientId = $client?->getKey();
        $emailRule = app()->environment(['local', 'testing']) ? 'email:rfc' : 'email:rfc,dns';

        return [
            'type' => ['required', Rule::in(['individual', 'corporate'])],

            'name' => ['nullable', 'string', 'max:255', 'required_if:type,individual'],
            'id_number' => [
                'nullable',
                'string',
                'max:50',
                'required_if:type,individual',
                Rule::unique('clients', 'id_number')->ignore($clientId),
            ],

            'company_name' => ['nullable', 'string', 'max:255', 'required_if:type,corporate'],
            'registration_number' => [
                'nullable',
                'string',
                'max:50',
                'required_if:type,corporate',
                Rule::unique('clients', 'registration_number')->ignore($clientId),
            ],

            'kra_pin' => ['required', 'string', 'max:50'],

            'phone' => ['required', 'string', 'max:50'],
            'email' => [
                'required',
                $emailRule,
                'max:255',
                Rule::unique('clients', 'email')->ignore($clientId),
            ],
            'address' => ['required', 'string', 'max:1000'],

            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
