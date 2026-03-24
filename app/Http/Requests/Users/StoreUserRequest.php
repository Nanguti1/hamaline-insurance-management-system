<?php

namespace App\Http\Requests\Users;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $roles = ['admin', 'underwriter', 'claims_officer', 'finance_officer', 'client'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', Rule::in($roles)],
            'is_active' => ['boolean'],
            'client_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn () => $this->input('role') === 'client'),
                Rule::exists('clients', 'id'),
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->input('role') !== 'client') {
                return;
            }

            $clientId = $this->input('client_id');
            if (! $clientId) {
                return;
            }

            $taken = Client::query()->whereKey($clientId)->whereNotNull('user_id')->exists();
            if ($taken) {
                $validator->errors()->add('client_id', 'This client already has a linked user account.');
            }
        });
    }
}
