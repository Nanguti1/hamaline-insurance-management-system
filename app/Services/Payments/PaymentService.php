<?php

namespace App\Services\Payments;

use App\Concerns\TracksUserStamps;
use App\Models\Payment;
use App\Services\Access\ResourceAccessService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaymentService
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
        $query = Payment::query()->with(['policy.client', 'policy.underwriter']);
        $this->access->scopePaymentsQuery($query, auth()->user());

        $q = $filters['q'] ?? null;
        $status = $filters['status'] ?? null;

        if ($status && in_array($status, ['pending', 'received', 'reversed'], true)) {
            $query->where('status', $status);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('payment_number', 'like', "%{$q}%")
                    ->orWhere('reference', 'like', "%{$q}%")
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
    public function create(array $data): Payment
    {
        $data = $this->withCreateAudit($this->normalize($data));
        if (auth()->id()) {
            $data['received_by'] = auth()->id();
        }

        return Payment::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Payment $payment, array $data): Payment
    {
        $payment->update($this->withUpdateAudit($this->normalize($data)));

        return $payment->refresh();
    }

    public function delete(Payment $payment): void
    {
        $payment->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        foreach (['reference', 'notes', 'method'] as $key) {
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
