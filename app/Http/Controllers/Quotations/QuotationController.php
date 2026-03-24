<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotations\StoreQuotationRequest;
use App\Http\Requests\Quotations\UpdateQuotationRequest;
use App\Models\Client;
use App\Models\Quotation;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\Quotations\QuotationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'underwriters' => $this->underwriterSelectOptions(),
        ]);
    }

    public function store(StoreQuotationRequest $request, QuotationService $service): RedirectResponse
    {
        $quotation = $service->create($request->validated());

        return to_route('quotations.show', $quotation);
    }

    public function show(Quotation $quotation): Response
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        return Inertia::render('quotations/show', [
            'quotation' => $quotation->load(['client', 'underwriter']),
        ]);
    }

    public function edit(Quotation $quotation): Response
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation->load(['client', 'underwriter']),
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptions(),
        ]);
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation, QuotationService $service): RedirectResponse
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        $service->update($quotation, $request->validated());

        return to_route('quotations.show', $quotation);
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
    private function underwriterSelectOptions()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            return Underwriter::query()
                ->where('user_id', $user->id)
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Underwriter::query()->orderBy('name')->get(['id', 'name']);
    }
}
