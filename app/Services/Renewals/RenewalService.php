<?php

namespace App\Services\Renewals;

use App\Models\Renewal;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RenewalService
{
    /**
     * @param  array{q?: string|null,status?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Renewal::query()->with(['policy']);

        $q = $filters['q'] ?? null;
        $status = $filters['status'] ?? null;

        if ($status && in_array($status, ['scheduled', 'completed', 'cancelled'], true)) {
            $query->where('status', $status);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('renewal_number', 'like', "%{$q}%")
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
    public function create(array $data): Renewal
    {
        return Renewal::create($this->normalize($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Renewal $renewal, array $data): Renewal
    {
        $renewal->update($this->normalize($data));
        return $renewal->refresh();
    }

    public function delete(Renewal $renewal): void
    {
        $renewal->delete();
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

        return $data;
    }
}

