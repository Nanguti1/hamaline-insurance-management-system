<?php

namespace App\Services\Commissions;

use App\Models\Commission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommissionService
{
    /**
     * @param  array{q?: string|null,status?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Commission::query()->with(['policy', 'underwriter']);

        $q = $filters['q'] ?? null;
        $status = $filters['status'] ?? null;

        if ($status && in_array($status, ['pending', 'paid', 'cancelled'], true)) {
            $query->where('status', $status);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('commission_number', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%")
                    ->orWhereHas('policy', function ($p) use ($q) {
                        $p->where('policy_number', 'like', "%{$q}%");
                    });
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Commission
    {
        return Commission::create($this->normalize($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Commission $commission, array $data): Commission
    {
        $commission->update($this->normalize($data));
        return $commission->refresh();
    }

    public function delete(Commission $commission): void
    {
        $commission->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function normalize(array $data): array
    {
        foreach (['notes'] as $key) {
            if (array_key_exists($key, $data) && is_string($data[$key])) {
                $data[$key] = trim($data[$key]);
                if ($data[$key] === '') {
                    $data[$key] = null;
                }
            }
        }

        // Empty string to null for numeric optionals
        foreach (['percentage'] as $key) {
            if (array_key_exists($key, $data) && ($data[$key] === '' || $data[$key] === 0)) {
                $data[$key] = $data[$key] === '' ? null : $data[$key];
            }
        }

        return $data;
    }
}

