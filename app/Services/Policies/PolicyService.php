<?php

namespace App\Services\Policies;

use App\Concerns\TracksUserStamps;
use App\Models\Policy;
use App\Services\Access\ResourceAccessService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PolicyService
{
    use TracksUserStamps;

    public function __construct(
        private ResourceAccessService $access,
    ) {}

    /**
     * @param  array{q?: string|null,status?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Policy::query()->with(['client', 'underwriter']);
        $this->access->scopePoliciesQuery($query, auth()->user());

        $q = $filters['q'] ?? null;
        $status = $filters['status'] ?? null;

        if ($status && in_array($status, ['active', 'lapsed', 'cancelled', 'expired', 'renewed'], true)) {
            $query->where('status', $status);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('policy_number', 'like', "%{$q}%")
                    ->orWhere('policy_type', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%");
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Policy
    {
        return Policy::create($this->withCreateAudit($this->normalize($data)));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Policy $policy, array $data): Policy
    {
        $policy->update($this->withUpdateAudit($this->normalize($data)));

        return $policy->refresh();
    }

    public function delete(Policy $policy): void
    {
        $policy->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        foreach (['policy_type', 'notes'] as $key) {
            if (array_key_exists($key, $data) && is_string($data[$key])) {
                $data[$key] = trim($data[$key]);
                if ($data[$key] === '') {
                    $data[$key] = null;
                }
            }
        }

        if (array_key_exists('quotation_id', $data) && ($data['quotation_id'] === '' || $data['quotation_id'] === 0)) {
            $data['quotation_id'] = null;
        }

        return $data;
    }
}
