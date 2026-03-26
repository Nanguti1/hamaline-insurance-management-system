<?php

namespace App\Http\Requests\Users;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

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
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->pluck('name')
            ->values()
            ->all();
        $emailRule = app()->environment(['local', 'testing']) ? 'email:rfc' : 'email:rfc,dns';

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', $emailRule, 'max:255', 'unique:users,email'],
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
