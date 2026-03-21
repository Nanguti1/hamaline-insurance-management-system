<?php

namespace App\Services\Claims;

use App\Models\Claim;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClaimService
{
    /**
     * @param  array{q?: string|null,status?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Claim::query()->with(['policy.client', 'policy.underwriter']);

        $q = $filters['q'] ?? null;
        $status = $filters['status'] ?? null;

        if ($status && in_array($status, ['submitted', 'assessing', 'approved', 'declined', 'settled'], true)) {
            $query->where('status', $status);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('claim_number', 'like', "%{$q}%")
                    ->orWhere('claimant_name', 'like', "%{$q}%")
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
    public function create(array $data): Claim
    {
        return Claim::create($this->normalize($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Claim $claim, array $data): Claim
    {
        $claim->update($this->normalize($data));
        return $claim->refresh();
    }

    public function delete(Claim $claim): void
    {
        $claim->delete();
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

