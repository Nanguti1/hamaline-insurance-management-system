<?php

namespace App\Services\Commissions;

use App\Concerns\TracksUserStamps;
use App\Models\Commission;
use App\Services\Access\ResourceAccessService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommissionService
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
        $query = Commission::query()->with(['policy', 'underwriter']);
        $this->access->scopeCommissionsQuery($query, auth()->user());

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
        $data = $this->withCreateAudit($this->normalize($data));
        if (auth()->id() && ! array_key_exists('user_id', $data)) {
            $data['user_id'] = auth()->id();
        }

        return Commission::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Commission $commission, array $data): Commission
    {
        $commission->update($this->withUpdateAudit($this->normalize($data)));

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
