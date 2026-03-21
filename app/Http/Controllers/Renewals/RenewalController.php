<?php

namespace App\Http\Controllers\Renewals;

use App\Http\Controllers\Controller;
use App\Http\Requests\Renewals\StoreRenewalRequest;
use App\Http\Requests\Renewals\UpdateRenewalRequest;
use App\Models\Policy;
use App\Models\Renewal;
use App\Services\Renewals\RenewalService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RenewalController extends Controller
{
    public function index(Request $request, RenewalService $service): Response
    {
        $renewals = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('renewals/index', [
            'renewals' => $renewals,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('renewals/create', [
            'policies' => Policy::query()
                ->orderBy('policy_number')
                ->get(['id', 'policy_number']),
        ]);
    }

    public function store(StoreRenewalRequest $request, RenewalService $service): RedirectResponse
    {
        $renewal = $service->create($request->validated());
        return to_route('renewals.show', $renewal);
    }

    public function show(Renewal $renewal): Response
    {
        return Inertia::render('renewals/show', [
            'renewal' => $renewal->load(['policy']),
        ]);
    }

    public function edit(Renewal $renewal): Response
    {
        return Inertia::render('renewals/edit', [
            'renewal' => $renewal->load(['policy']),
            'policies' => Policy::query()
                ->orderBy('policy_number')
                ->get(['id', 'policy_number']),
        ]);
    }

    public function update(UpdateRenewalRequest $request, Renewal $renewal, RenewalService $service): RedirectResponse
    {
        $service->update($renewal, $request->validated());
        return to_route('renewals.show', $renewal);
    }

    public function destroy(Renewal $renewal, RenewalService $service): RedirectResponse
    {
        $service->delete($renewal);
        return to_route('renewals.index');
    }
}

