<?php

namespace App\Http\Controllers\Policies;

use App\Http\Controllers\Controller;
use App\Http\Requests\Policies\StorePolicyRequest;
use App\Http\Requests\Policies\UpdatePolicyRequest;
use App\Models\Client;
use App\Models\Insurer;
use App\Models\Policy;
use App\Models\Quotation;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\Policies\PolicyService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function index(Request $request, PolicyService $service): Response
    {
        $policies = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('policies/index', [
            'policies' => $policies,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('policies/create', [
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
            'quotations' => Quotation::query()
                ->orderBy('quotation_number')
                ->get([
                    'id',
                    'quotation_number',
                    'client_id',
                    'underwriter_id',
                    'insurer_id',
                    'premium_amount',
                    'currency',
                    'valid_until',
                    'policy_type',
                    'notes',
                ]),
        ]);
    }

    public function store(StorePolicyRequest $request, PolicyService $service): RedirectResponse
    {
        $policy = $service->create($request->validated());

        return to_route('policies.show', $policy);
    }

    public function show(Policy $policy): Response
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $policy->load(['client', 'underwriter', 'insurer', 'quotation', 'documents', 'riskNotes']);

        $documents = $policy->documents->map(fn ($doc) => [
            'id' => $doc->id,
            'name' => $doc->name,
            'url' => Storage::disk('public')->url($doc->file_path),
            'mime_type' => $doc->mime_type,
            'size' => $doc->size,
        ]);

        $riskNote = $policy->riskNotes->first();

        return Inertia::render('policies/show', [
            'policy' => $policy,
            'documents' => $documents,
            'linkedRiskNote' => $riskNote ? [
                'id' => $riskNote->id,
                'line_type' => $riskNote->line_type,
                'risk_note_number' => $riskNote->risk_note_number,
            ] : null,
        ]);
    }

    public function edit(Policy $policy): Response
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        return Inertia::render('policies/edit', [
            'policy' => $policy->load(['client', 'underwriter', 'insurer', 'quotation']),
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
            'quotations' => Quotation::query()
                ->orderBy('quotation_number')
                ->get([
                    'id',
                    'quotation_number',
                    'client_id',
                    'underwriter_id',
                    'insurer_id',
                    'premium_amount',
                    'currency',
                    'valid_until',
                    'policy_type',
                    'notes',
                ]),
        ]);
    }

    public function update(UpdatePolicyRequest $request, Policy $policy, PolicyService $service): RedirectResponse
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $service->update($policy, $request->validated());

        return to_route('policies.show', $policy);
    }

    public function destroy(Policy $policy, PolicyService $service): RedirectResponse
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $service->delete($policy);

        return to_route('policies.index');
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
