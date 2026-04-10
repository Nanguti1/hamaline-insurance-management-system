<?php

namespace App\Http\Controllers\Claims;

use App\Http\Controllers\Controller;
use App\Http\Requests\Claims\StoreClaimRequest;
use App\Http\Requests\Claims\UpdateClaimRequest;
use App\Models\Claim;
use App\Services\Access\ResourceAccessService;
use App\Services\Claims\ClaimService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClaimController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function index(Request $request, ClaimService $service): Response
    {
        $claims = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('claims/index', [
            'claims' => $claims,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('claims/create', [
            'policies' => $this->access->policiesForClaimForm(auth()->user()),
        ]);
    }

    public function store(StoreClaimRequest $request, ClaimService $service): RedirectResponse
    {
        $claim = $service->create($request->validated());

        return to_route('claims.show', $claim)->with('success', 'Claim created successfully.');
    }

    public function show(Claim $claim): Response
    {
        $this->access->assertCanViewClaim(auth()->user(), $claim);

        $claim->load(['policy.client', 'policy.underwriter', 'documents']);

        $documents = $claim->documents->map(fn ($doc) => [
            'id' => $doc->id,
            'name' => $doc->name,
            'url' => Storage::disk('public')->url($doc->file_path),
            'mime_type' => $doc->mime_type,
            'size' => $doc->size,
        ]);

        return Inertia::render('claims/show', [
            'claim' => $claim,
            'documents' => $documents,
        ]);
    }

    public function edit(Claim $claim): Response
    {
        $this->access->assertCanViewClaim(auth()->user(), $claim);

        return Inertia::render('claims/edit', [
            'claim' => $claim->load(['policy.client', 'policy.underwriter']),
            'policies' => $this->access->policiesForClaimForm(auth()->user()),
        ]);
    }

    public function update(
        UpdateClaimRequest $request,
        Claim $claim,
        ClaimService $service
    ): RedirectResponse {
        $this->access->assertCanViewClaim(auth()->user(), $claim);

        $service->update($claim, $request->validated());

        return to_route('claims.show', $claim)->with('success', 'Claim updated successfully.');
    }

    public function destroy(Claim $claim, ClaimService $service): RedirectResponse
    {
        $this->access->assertCanViewClaim(auth()->user(), $claim);

        $service->delete($claim);

        return to_route('claims.index');
    }
}
