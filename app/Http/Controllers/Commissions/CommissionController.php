<?php

namespace App\Http\Controllers\Commissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commissions\StoreCommissionRequest;
use App\Http\Requests\Commissions\UpdateCommissionRequest;
use App\Models\Commission;
use App\Models\Policy;
use App\Models\Underwriter;
use App\Services\Commissions\CommissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request, CommissionService $service): Response
    {
        $commissions = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('commissions/index', [
            'commissions' => $commissions,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('commissions/create', [
            'policies' => Policy::query()
                ->orderBy('policy_number')
                ->get(['id', 'policy_number', 'premium_amount', 'currency', 'underwriter_id']),
            'underwriters' => Underwriter::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreCommissionRequest $request, CommissionService $service): RedirectResponse
    {
        $commission = $service->create($request->validated());

        return to_route('commissions.show', $commission)->with('success', 'Commission created successfully.');
    }

    public function show(Commission $commission): Response
    {
        return Inertia::render('commissions/show', [
            'commission' => $commission->load(['policy', 'underwriter']),
        ]);
    }

    public function edit(Commission $commission): Response
    {
        return Inertia::render('commissions/edit', [
            'commission' => $commission->load(['policy', 'underwriter']),
            'policies' => Policy::query()
                ->orderBy('policy_number')
                ->get(['id', 'policy_number', 'premium_amount', 'currency', 'underwriter_id']),
            'underwriters' => Underwriter::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(UpdateCommissionRequest $request, Commission $commission, CommissionService $service): RedirectResponse
    {
        $service->update($commission, $request->validated());

        return to_route('commissions.show', $commission)->with('success', 'Commission updated successfully.');
    }

    public function destroy(Commission $commission, CommissionService $service): RedirectResponse
    {
        $service->delete($commission);

        return to_route('commissions.index');
    }
}
