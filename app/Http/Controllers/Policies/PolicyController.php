<?php

namespace App\Http\Controllers\Policies;

use App\Http\Controllers\Controller;
use App\Http\Requests\Policies\StorePolicyRequest;
use App\Http\Requests\Policies\UpdatePolicyRequest;
use App\Models\Client;
use App\Models\Policy;
use App\Models\Quotation;
use App\Models\Underwriter;
use App\Services\Policies\PolicyService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
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
            'underwriters' => Underwriter::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'quotations' => Quotation::query()
                ->orderBy('quotation_number')
                ->get(['id', 'quotation_number']),
        ]);
    }

    public function store(StorePolicyRequest $request, PolicyService $service): RedirectResponse
    {
        $policy = $service->create($request->validated());

        return to_route('policies.show', $policy);
    }

    public function show(Policy $policy): Response
    {
        $policy->load(['client', 'underwriter', 'quotation', 'documents']);

        $documents = $policy->documents->map(fn ($doc) => [
            'id' => $doc->id,
            'name' => $doc->name,
            'url' => Storage::disk('public')->url($doc->file_path),
            'mime_type' => $doc->mime_type,
            'size' => $doc->size,
        ]);

        return Inertia::render('policies/show', [
            'policy' => $policy,
            'documents' => $documents,
        ]);
    }

    public function edit(Policy $policy): Response
    {
        return Inertia::render('policies/edit', [
            'policy' => $policy->load(['client', 'underwriter', 'quotation']),
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => Underwriter::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'quotations' => Quotation::query()
                ->orderBy('quotation_number')
                ->get(['id', 'quotation_number']),
        ]);
    }

    public function update(UpdatePolicyRequest $request, Policy $policy, PolicyService $service): RedirectResponse
    {
        $service->update($policy, $request->validated());

        return to_route('policies.show', $policy);
    }

    public function destroy(Policy $policy, PolicyService $service): RedirectResponse
    {
        $service->delete($policy);
        return to_route('policies.index');
    }
}

