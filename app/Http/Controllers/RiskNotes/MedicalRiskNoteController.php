<?php

namespace App\Http\Controllers\RiskNotes;

use App\Http\Controllers\Controller;
use App\Http\Requests\RiskNotes\AssignMedicalMemberNumbersRequest;
use App\Http\Requests\RiskNotes\CancelMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\DecideMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\StoreMedicalRiskNoteRequest;
use App\Models\Client;
use App\Models\MedicalMember;
use App\Models\MedicalRiskNoteDetails;
use App\Models\RiskNote;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\RiskNotes\RiskNoteService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class MedicalRiskNoteController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
        private RiskNoteService $riskNoteService,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $q = $request->query('q');

        $query = RiskNote::query()
            ->where('line_type', 'medical')
            ->with(['client', 'underwriter', 'medicalMembers', 'medicalDetails']);

        $this->access->scopeRiskNotesQuery($query, $request->user(), 'medical');

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

        return Inertia::render('medical-risks/index', [
            'riskNotes' => $riskNotes,
            'filters' => [
                'q' => $q,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('medical-risks/create', [
            'clients' => Client::query()->orderBy('name')->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptions(),
        ]);
    }

    public function store(StoreMedicalRiskNoteRequest $request): RedirectResponse
    {
        $riskNote = $this->riskNoteService->createMedicalRiskNote(
            $request->validated() + ['members' => $request->input('members')],
            $request->user(),
        );

        return to_route('medical-risks.show', $riskNote);
    }

    public function show(RiskNote $medicalRiskNote): Response
    {
        $this->access->assertCanViewRiskNote(Auth::user(), $medicalRiskNote);

        $medicalRiskNote->load([
            'client',
            'underwriter',
            'medicalDetails',
            'medicalMembers.benefits',
            'underwritingDecisions',
            'policy',
        ]);

        return Inertia::render('medical-risks/show', [
            'riskNote' => $medicalRiskNote,
        ]);
    }

    public function generate(RiskNote $medicalRiskNote, Request $request): RedirectResponse
    {
        $this->access->assertCanUnderwriteRiskNote($request->user(), $medicalRiskNote);

        if ($medicalRiskNote->status !== RiskNoteService::STATUS_DRAFT) {
            // Allow regenerate while draft only; pending/active/cancelled are locked.
            return to_route('medical-risks.show', $medicalRiskNote);
        }

        $this->riskNoteService->generateMedicalRiskNoteContent($medicalRiskNote);

        return to_route('medical-risks.show', $medicalRiskNote);
    }

    public function submit(RiskNote $medicalRiskNote, Request $request): RedirectResponse
    {
        $this->access->assertCanUnderwriteRiskNote($request->user(), $medicalRiskNote);

        if ($medicalRiskNote->status !== RiskNoteService::STATUS_DRAFT) {
            return to_route('medical-risks.show', $medicalRiskNote);
        }

        if (! $medicalRiskNote->relationLoaded('medicalDetails')) {
            $medicalRiskNote->load(['medicalDetails', 'medicalMembers.benefits']);
        }

        if (! $medicalRiskNote->risk_note_content) {
            $this->riskNoteService->generateMedicalRiskNoteContent($medicalRiskNote);
        }

        $this->riskNoteService->submitForUnderwriting($medicalRiskNote, $request->user());

        return to_route('medical-risks.show', $medicalRiskNote);
    }

    public function approve(RiskNote $medicalRiskNote, DecideMedicalRiskNoteRequest $request): RedirectResponse
    {
        $this->access->assertCanUnderwriteRiskNote($request->user(), $medicalRiskNote);

        if ($medicalRiskNote->status !== RiskNoteService::STATUS_PENDING) {
            return to_route('medical-risks.show', $medicalRiskNote);
        }

        $this->riskNoteService->approveUnderwriting(
            $medicalRiskNote,
            $request->user(),
            $request->input('decision_notes'),
        );

        return to_route('medical-risks.show', $medicalRiskNote);
    }

    public function reject(RiskNote $medicalRiskNote, DecideMedicalRiskNoteRequest $request): RedirectResponse
    {
        $this->access->assertCanUnderwriteRiskNote($request->user(), $medicalRiskNote);

        if ($medicalRiskNote->status !== RiskNoteService::STATUS_PENDING) {
            return to_route('medical-risks.show', $medicalRiskNote);
        }

        $this->riskNoteService->rejectUnderwriting(
            $medicalRiskNote,
            $request->user(),
            $request->input('decision_notes'),
        );

        return to_route('medical-risks.show', $medicalRiskNote);
    }

    public function cancel(RiskNote $medicalRiskNote, CancelMedicalRiskNoteRequest $request): RedirectResponse
    {
        $this->access->assertCanUnderwriteRiskNote($request->user(), $medicalRiskNote);

        if (! in_array($medicalRiskNote->status, [RiskNoteService::STATUS_DRAFT, RiskNoteService::STATUS_PENDING], true)) {
            return to_route('medical-risks.show', $medicalRiskNote);
        }

        $this->riskNoteService->cancelRiskNote(
            $medicalRiskNote,
            $request->user(),
            $request->input('reason'),
        );

        return to_route('medical-risks.show', $medicalRiskNote);
    }

    public function assignMemberNumbers(
        RiskNote $medicalRiskNote,
        AssignMedicalMemberNumbersRequest $request,
    ): RedirectResponse {
        $this->access->assertCanUnderwriteRiskNote($request->user(), $medicalRiskNote);

        $payload = $request->validated()['members'];

        // Update medical members for this risk note.
        foreach ($payload as $row) {
            /** @var MedicalMember|null $member */
            $member = $medicalRiskNote->medicalMembers()->whereKey($row['id'])->first();
            if (! $member) {
                continue;
            }

            $member->update([
                'member_number' => $row['member_number'],
            ]);
        }

        return to_route('medical-risks.show', $medicalRiskNote);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{id:int,name:string|null}>
     */
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

