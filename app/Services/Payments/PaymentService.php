<?php

namespace App\Services\Payments;

use App\Concerns\TracksUserStamps;
use App\Models\Payment;
use App\Services\Access\ResourceAccessService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PaymentService
{
    use TracksUserStamps;

    public function __construct(
        private ResourceAccessService $access,
    ) {}

    /**
     * @param  array{q?: string|null,status?: string|null,flow?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Payment::query()->with(['policy.client', 'policy.underwriter']);
        $this->access->scopePaymentsQuery($query, Auth::user());

        $q = $filters['q'] ?? null;
        $status = $filters['status'] ?? null;
        $flow = $filters['flow'] ?? null;

        if ($status && in_array($status, ['pending', 'received', 'reversed'], true)) {
            $query->where('status', $status);
        }

        if ($flow && in_array($flow, ['in', 'out'], true)) {
            $query->where('flow', $flow);
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
        $proof = $data['proof'] ?? null;
        if (array_key_exists('proof', $data)) {
            unset($data['proof']);
        }

        $data = $this->withCreateAudit($this->normalize($data));

        if ($proof instanceof UploadedFile) {
            $data = array_merge($data, $this->storeProof($proof));
        }

        if (Auth::id()) {
            $data['received_by'] = Auth::id();
        }

        return Payment::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Payment $payment, array $data): Payment
    {
        $proof = $data['proof'] ?? null;
        if (array_key_exists('proof', $data)) {
            unset($data['proof']);
        }

        $payload = $this->withUpdateAudit($this->normalize($data));

        if ($proof instanceof UploadedFile) {
            if ($payment->proof_file_path) {
                Storage::disk('public')->delete($payment->proof_file_path);
            }
            $payload = array_merge($payload, $this->storeProof($proof));
        }

        $payment->update($payload);

        return $payment->refresh();
    }

    public function delete(Payment $payment): void
    {
        if ($payment->proof_file_path) {
            Storage::disk('public')->delete($payment->proof_file_path);
        }

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

    /**
     * @return array{proof_file_path: string, proof_file_name: string, proof_mime_type: string|null, proof_size: int}
     */
    private function storeProof(UploadedFile $proof): array
    {
        $path = $proof->store('payment-proofs', 'public');

        return [
            'proof_file_path' => $path,
            'proof_file_name' => $proof->getClientOriginalName(),
            'proof_mime_type' => $proof->getClientMimeType(),
            'proof_size' => $proof->getSize() ?? 0,
        ];
    }
}
