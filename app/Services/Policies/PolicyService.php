<?php

namespace App\Services\Policies;

use App\Concerns\TracksUserStamps;
use App\Models\Policy;
use App\Models\RiskNote;
use App\Services\Access\ResourceAccessService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

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

        if ($status && in_array($status, ['pending', 'active', 'lapsed', 'cancelled', 'expired', 'renewed'], true)) {
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
        $policy = Policy::create($this->withCreateAudit($this->normalize($data)));
        $this->syncRiskNoteFromPolicy($policy);

        return $policy;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Policy $policy, array $data): Policy
    {
        $policy->update($this->withUpdateAudit($this->normalize($data)));
        $this->syncRiskNoteFromPolicy($policy->refresh());

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
        foreach (['policy_type', 'notes', 'risk_note_content'] as $key) {
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

    private function syncRiskNoteFromPolicy(Policy $policy): void
    {
        $lineType = $this->mapPolicyTypeToLineType($policy->policy_type);

        $attrs = [
            'line_type' => $lineType,
            'client_id' => $policy->client_id,
            'underwriter_id' => $policy->underwriter_id,
            'start_date' => $policy->start_date,
            'end_date' => $policy->end_date,
            'premium_amount' => $policy->premium_amount,
            'currency' => $policy->currency,
            'notes' => $policy->notes,
            'risk_note_content' => $policy->risk_note_content,
            'policy_id' => $policy->id,
            'updated_by' => $policy->updated_by,
        ];

        $existing = RiskNote::query()->where('policy_id', $policy->id)->first();

        if ($existing) {
            $existing->update($attrs);

            return;
        }

        $attrs['risk_note_number'] = $this->nextRiskNoteNumber();
        $attrs['status'] = 'draft';
        $attrs['created_by'] = $policy->created_by;

        RiskNote::create($attrs);
    }

    private function mapPolicyTypeToLineType(?string $policyType): string
    {
        $t = strtolower((string) $policyType);

        return match (true) {
            str_contains($t, 'medical') => 'medical',
            str_contains($t, 'wiba') => 'wiba',
            default => 'motor',
        };
    }

    private function nextRiskNoteNumber(): string
    {
        do {
            $n = 'RN-'.now()->format('Y').'-'.strtoupper(Str::random(5));
        } while (RiskNote::query()->where('risk_note_number', $n)->exists());

        return $n;
    }
}
