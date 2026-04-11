<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotations\StoreQuotationRequest;
use App\Http\Requests\Quotations\UpdateQuotationRequest;
use App\Mail\QuotationIssuedMail;
use App\Models\Client;
use App\Models\Insurer;
use App\Models\Quotation;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\Quotations\QuotationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function index(Request $request, QuotationService $service): Response
    {
        $quotations = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('quotations/create', [
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
        ]);
    }

    public function store(StoreQuotationRequest $request, QuotationService $service): RedirectResponse
    {
        $quotation = $service->create($request->validated());
        $quotation->load(['client', 'underwriter']);

        $email = $quotation->client?->email;
        if ($quotation->status === 'issued' && is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Mail::to($email)->send(new QuotationIssuedMail($quotation));
        }

        return to_route('quotations.show', $quotation)->with('success', 'Quotation created successfully.');
    }

    public function suggestions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'insurer_id' => ['required', 'integer', 'exists:insurers,id'],
            'policy_type' => ['required', 'string', 'in:motor,medical,wiba'],
        ]);

        $user = $request->user();
        if ($user?->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if (! $uwId || (int) $data['underwriter_id'] !== (int) $uwId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $allowed = DB::table('insurer_underwriter')
            ->where('underwriter_id', (int) $data['underwriter_id'])
            ->where('insurer_id', (int) $data['insurer_id'])
            ->exists();
        if (! $allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $latest = Quotation::query()
            ->where('client_id', (int) $data['client_id'])
            ->where('underwriter_id', (int) $data['underwriter_id'])
            ->where('insurer_id', (int) $data['insurer_id'])
            ->where('policy_type', (string) $data['policy_type'])
            ->orderByDesc('id')
            ->first();

        $client = $latest?->client ?? Client::query()->find($data['client_id']);
        $underwriter = $latest?->underwriter ?? Underwriter::query()->find($data['underwriter_id']);

        $fallbackNotes = trim(implode("\n", array_filter([
            $client?->notes,
            $underwriter?->notes,
        ])));

        return response()->json([
            'premium_amount' => $latest?->premium_amount,
            'currency' => $latest?->currency,
            'valid_until' => $latest?->valid_until?->format('Y-m-d'),
            'notes' => $latest?->notes ?? ($fallbackNotes !== '' ? $fallbackNotes : null),
            'payment_plan' => $latest?->payment_plan ?? 'one_off',
            'installment_count' => $latest?->installment_count,
            'policy_type' => $latest?->policy_type ?? $data['policy_type'],
        ]);
    }

    public function show(Quotation $quotation): Response
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        return Inertia::render('quotations/show', [
            'quotation' => $quotation->load(['client', 'underwriter', 'insurer']),
        ]);
    }

    public function edit(Quotation $quotation): Response
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation->load(['client', 'underwriter', 'insurer']),
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
        ]);
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation, QuotationService $service): RedirectResponse
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        $previousStatus = $quotation->status;
        $service->update($quotation, $request->validated());

        if ($previousStatus !== 'issued' && $quotation->status === 'issued') {
            $quotation->loadMissing(['client']);
            $email = $quotation->client?->email;
            if (is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Mail::to($email)->send(new QuotationIssuedMail($quotation->fresh(['client'])));
            }
        }

        return to_route('quotations.show', $quotation)->with('success', 'Quotation updated successfully.');
    }

    public function destroy(Quotation $quotation, QuotationService $service): RedirectResponse
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        $service->delete($quotation);

        return to_route('quotations.index');
    }

    /**
     * @return Collection<int, Underwriter>
     */
    private function underwriterSelectOptionsWithInsurers()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            return Underwriter::query()
                ->where('user_id', $user->id)
                ->with(['insurers:id,name'])
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Underwriter::query()
            ->with(['insurers:id,name'])
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return Collection<int, Insurer>
     */
    private function insurerSelectOptions()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if (! $uwId) {
                return collect();
            }

            return Insurer::query()
                ->whereIn('id', function ($q) use ($uwId) {
                    $q->select('insurer_id')
                        ->from('insurer_underwriter')
                        ->where('underwriter_id', (int) $uwId);
                })
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Insurer::query()->orderBy('name')->get(['id', 'name']);
    }
}
