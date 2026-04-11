<?php

namespace App\Http\Controllers\RiskNotes;

use App\Http\Controllers\RiskNotes\Concerns\BuildsRiskNotePdfHtml;
use App\Http\Controllers\Controller;
use App\Http\Requests\RiskNotes\CancelMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\DecideMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\StoreWibaRiskNoteRequest;
use App\Models\Client;
use App\Models\RiskNote;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\RiskNotes\RiskNoteService;
use Dompdf\Dompdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class WibaRiskNoteController extends Controller
{
    use BuildsRiskNotePdfHtml;

    public function __construct(
        private ResourceAccessService $access,
        private RiskNoteService $riskNoteService,
    ) {}

    public function index(Request $request): InertiaResponse
    {
        $status = $request->query('status');
        $q = $request->query('q');

        $query = RiskNote::query()
            ->where('line_type', 'wiba')
            ->with(['client', 'underwriter', 'wibaEmployees']);

        $this->access->scopeRiskNotesQuery($query, $request->user(), 'wiba');

        if ($status && is_string($status)) {
            $query->where('status', $status);
        }

        if ($q && is_string($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('risk_note_number', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%");
            });
        }

        /** @var LengthAwarePaginator $riskNotes */
        $riskNotes = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        return Inertia::render('wiba-risks/index', [
            'riskNotes' => $riskNotes,
            'filters' => [
                'q' => $q,
                'status' => $status,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('wiba-risks/create', [
            'clients' => Client::query()
                ->where('type', 'corporate')
                ->orderBy('company_name')
                ->get(['id', 'name', 'company_name', 'type']),
            'underwriters' => $this->underwriterSelectOptions(),
        ]);
    }

    public function store(StoreWibaRiskNoteRequest $request): RedirectResponse
    {
        $riskNote = $this->riskNoteService->createWibaRiskNote($request->validated(), $request->user());

        return to_route('wiba-risks.show', $riskNote);
    }

    public function show(RiskNote $wibaRiskNote): InertiaResponse
    {
        $this->access->assertCanViewRiskNote(Auth::user(), $wibaRiskNote);

        $wibaRiskNote->load([
            'client',
            'underwriter',
            'wibaEmployees',
            'underwritingDecisions',
            'policy',
        ]);

        return Inertia::render('wiba-risks/show', [
            'riskNote' => $wibaRiskNote,
        ]);
    }

    public function generate(RiskNote $wibaRiskNote): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $wibaRiskNote);

        if ($wibaRiskNote->status !== RiskNoteService::STATUS_DRAFT) {
            return to_route('wiba-risks.show', $wibaRiskNote);
        }

        $this->riskNoteService->generateWibaRiskNoteContent($wibaRiskNote);

        return to_route('wiba-risks.show', $wibaRiskNote);
    }

    public function downloadPDF(RiskNote $wibaRiskNote, Request $request): Response
    {
        $this->access->assertCanViewRiskNote($request->user(), $wibaRiskNote);

        if (! $wibaRiskNote->risk_note_content) {
            $this->riskNoteService->generateWibaRiskNoteContent($wibaRiskNote);
        }

        $html = $this->buildRiskNotePdfHtml(
            $wibaRiskNote->risk_note_content ?? '',
            'WIBA',
            $wibaRiskNote->risk_note_number,
            $wibaRiskNote->insurer?->name ?? '-',
        );

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->stream("{$wibaRiskNote->risk_note_number}.pdf");
    }

    public function submit(RiskNote $wibaRiskNote): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $wibaRiskNote);

        if ($wibaRiskNote->status !== RiskNoteService::STATUS_DRAFT) {
            return to_route('wiba-risks.show', $wibaRiskNote);
        }

        if (! $wibaRiskNote->risk_note_content) {
            $this->riskNoteService->generateWibaRiskNoteContent($wibaRiskNote);
        }

        $this->riskNoteService->submitForUnderwriting($wibaRiskNote, $user);

        return to_route('wiba-risks.show', $wibaRiskNote);
    }

    public function approve(RiskNote $wibaRiskNote, DecideMedicalRiskNoteRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $wibaRiskNote);

        if ($wibaRiskNote->status !== RiskNoteService::STATUS_PENDING) {
            return to_route('wiba-risks.show', $wibaRiskNote);
        }

        $this->riskNoteService->approveUnderwriting(
            $wibaRiskNote,
            $user,
            $request->input('decision_notes'),
        );

        return to_route('wiba-risks.show', $wibaRiskNote);
    }

    public function reject(RiskNote $wibaRiskNote, DecideMedicalRiskNoteRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $wibaRiskNote);

        if ($wibaRiskNote->status !== RiskNoteService::STATUS_PENDING) {
            return to_route('wiba-risks.show', $wibaRiskNote);
        }

        $this->riskNoteService->rejectUnderwriting(
            $wibaRiskNote,
            $user,
            $request->input('decision_notes'),
        );

        return to_route('wiba-risks.show', $wibaRiskNote);
    }

    public function cancel(RiskNote $wibaRiskNote, CancelMedicalRiskNoteRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $wibaRiskNote);

        if (! in_array($wibaRiskNote->status, [RiskNoteService::STATUS_DRAFT, RiskNoteService::STATUS_PENDING], true)) {
            return to_route('wiba-risks.show', $wibaRiskNote);
        }

        $this->riskNoteService->cancelRiskNote($wibaRiskNote, $user, $request->input('reason'));

        return to_route('wiba-risks.show', $wibaRiskNote);
    }

    private function underwriterSelectOptions()
    {
        $user = Auth::user();
        if ($user?->hasRole('underwriter')) {
            return Underwriter::query()
                ->where('user_id', $user->id)
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Underwriter::query()->orderBy('name')->get(['id', 'name']);
    }
}
