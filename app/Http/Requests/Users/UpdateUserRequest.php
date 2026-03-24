<?php

namespace App\Http\Requests\Users;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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

        /** @var User|null $target */
        $target = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                Rule::unique('users', 'email')->ignore($target?->getKey()),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', Rule::in($roles)],
            'is_active' => ['required', 'boolean'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->input('role') === 'client' && ! $this->filled('client_id')) {
                $validator->errors()->add('client_id', 'Select a client record to link.');
            }

            if ($this->input('role') !== 'client') {
                return;
            }

            $clientId = $this->input('client_id');
            if (! $clientId) {
                return;
            }

            /** @var User|null $target */
            $target = $this->route('user');

            $query = Client::query()->whereKey($clientId)->whereNotNull('user_id');
            if ($target) {
                $query->where('user_id', '!=', $target->id);
            }

            if ($query->exists()) {
                $validator->errors()->add('client_id', 'This client already has a linked user account.');
            }
        });
    }
}
