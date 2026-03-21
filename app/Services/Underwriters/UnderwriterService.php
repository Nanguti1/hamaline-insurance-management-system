<?php

namespace App\Services\Underwriters;

use App\Models\Underwriter;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UnderwriterService
{
    /**
     * @param  array{q?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Underwriter::query();

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
        return Underwriter::create($this->normalize($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Underwriter $underwriter, array $data): Underwriter
    {
        $underwriter->update($this->normalize($data));
        return $underwriter->refresh();
    }

    public function delete(Underwriter $underwriter): void
    {
        $underwriter->delete();
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

