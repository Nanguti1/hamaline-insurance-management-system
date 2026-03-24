<?php

namespace App\Services\Underwriters;

use App\Models\Underwriter;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UnderwriterService
{
    /**
     * @param  array{q?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Underwriter::query()->with('user');

        $q = $filters['q'] ?? null;
        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Underwriter
    {
        return DB::transaction(function () use ($data) {
            $password = $data['password'];
            unset($data['password'], $data['password_confirmation']);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $password,
                'is_active' => true,
            ]);
            $user->assignRole('underwriter');

            $row = $this->normalize($data);
            $row['user_id'] = $user->id;

            return Underwriter::create($row);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Underwriter $underwriter, array $data): Underwriter
    {
        return DB::transaction(function () use ($underwriter, $data) {
            $password = $data['password'] ?? null;
            unset($data['password'], $data['password_confirmation']);

            $row = $this->normalize($data);
            $underwriter->update($row);

            if ($underwriter->user) {
                $userData = [
                    'name' => $row['name'],
                    'email' => $row['email'],
                ];
                if (! empty($password)) {
                    $userData['password'] = $password;
                }
                $underwriter->user->update($userData);
            }

            return $underwriter->refresh();
        });
    }

    public function delete(Underwriter $underwriter): void
    {
        DB::transaction(function () use ($underwriter) {
            $user = $underwriter->user;
            $underwriter->delete();
            $user?->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        foreach (['address', 'notes'] as $key) {
            if (array_key_exists($key, $data) && is_string($data[$key])) {
                $data[$key] = trim($data[$key]);
                if ($data[$key] === '') {
                    $data[$key] = null;
                }
            }
        }

        return $data;
    }
}
