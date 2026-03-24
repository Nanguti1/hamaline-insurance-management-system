<?php

namespace App\Services\Users;

use App\Models\Client;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService
{
    /**
     * @param  array{q?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()->with('roles');

        $q = $filters['q'] ?? null;
        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return $query->orderBy('name')->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array{name: string, email: string, password: string, role: string, is_active?: bool, client_id?: int|null}  $data
     */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $user->syncRoles([$data['role']]);

            if ($data['role'] === 'client' && ! empty($data['client_id'])) {
                Client::query()->whereKey($data['client_id'])->whereNull('user_id')->update([
                    'user_id' => $user->id,
                ]);
            }

            return $user->refresh();
        });
    }

    /**
     * @param  array{name?: string, email?: string, password?: string|null, role?: string, is_active?: bool, client_id?: int|null}  $data
     */
    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            if (array_key_exists('name', $data)) {
                $user->name = $data['name'];
            }
            if (array_key_exists('email', $data)) {
                $user->email = $data['email'];
            }
            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }
            if (array_key_exists('is_active', $data)) {
                $user->is_active = (bool) $data['is_active'];
            }
            $user->save();

            if (isset($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            $user->refresh();

            if ($user->hasRole('client')) {
                if (array_key_exists('client_id', $data)) {
                    Client::query()->where('user_id', $user->id)->update(['user_id' => null]);
                    if (! empty($data['client_id'])) {
                        Client::query()->whereKey($data['client_id'])->whereNull('user_id')->update([
                            'user_id' => $user->id,
                        ]);
                    }
                }
            } else {
                Client::query()->where('user_id', $user->id)->update(['user_id' => null]);
            }

            return $user->refresh();
        });
    }

    public function resetPassword(User $user, string $password): User
    {
        $user->password = $password;
        $user->save();

        return $user->refresh();
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            Client::query()->where('user_id', $user->id)->update(['user_id' => null]);
            $user->delete();
        });
    }
}
