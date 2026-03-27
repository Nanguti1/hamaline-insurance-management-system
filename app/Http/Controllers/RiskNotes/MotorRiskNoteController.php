<?php

namespace App\Http\Controllers\RiskNotes;

use App\Http\Controllers\Controller;
use App\Http\Requests\RiskNotes\DecideMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\CancelMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\StoreMotorRiskNoteRequest;
use App\Models\Client;
use App\Models\MotorRiskNoteDetails;
use App\Models\RiskNote;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\RiskNotes\RiskNoteService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MotorRiskNoteController extends Controller
{
    private const REQUIRED_DOCUMENT_LABELS = ['Log book', 'ID copy', 'KRA PIN'];

    public function __construct(
        private ResourceAccessService $access,
        private RiskNoteService $riskNoteService,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $q = $request->query('q');

        $query = RiskNote::query()
            ->where('line_type', 'motor')
            ->with(['client', 'underwriter', 'motorDetails']);

        $this->access->scopeRiskNotesQuery($query, $request->user(), 'motor');

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

        return Inertia::render('motor-risks/index', [
            'riskNotes' => $riskNotes,
            'filters' => [
                'q' => $q,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('motor-risks/create', [
            'clients' => Client::query()->orderBy('name')->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptions(),
        ]);
    }

    public function store(StoreMotorRiskNoteRequest $request): RedirectResponse
    {
        $riskNote = $this->riskNoteService->createMotorRiskNote($request->validated(), $request->user());

        return to_route('motor-risks.show', $riskNote);
    }

    public function show(RiskNote $motorRiskNote): Response
    {
        $this->access->assertCanViewRiskNote(Auth::user(), $motorRiskNote);

        $motorRiskNote->load([
            'client',
            'underwriter',
            'motorDetails',
            'underwritingDecisions',
            'policy',
            'documents',
        ]);

        return Inertia::render('motor-risks/show', [
            'riskNote' => $motorRiskNote,
            'documents' => $motorRiskNote->documents->map(fn ($doc) => [
                'id' => $doc->id,
                'name' => $doc->name,
                'url' => Storage::url($doc->file_path),
                'mime_type' => $doc->mime_type,
                'size' => $doc->size,
            ])->values(),
        ]);
    }

    public function generate(RiskNote $motorRiskNote): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $motorRiskNote);

        if ($motorRiskNote->status !== RiskNoteService::STATUS_DRAFT) {
            return to_route('motor-risks.show', $motorRiskNote);
        }

        $this->riskNoteService->generateMotorRiskNoteContent($motorRiskNote);

        return to_route('motor-risks.show', $motorRiskNote);
    }

    public function submit(RiskNote $motorRiskNote): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $motorRiskNote);

        if ($motorRiskNote->status !== RiskNoteService::STATUS_DRAFT) {
            return to_route('motor-risks.show', $motorRiskNote);
        }

        if (! $motorRiskNote->risk_note_content) {
            $this->riskNoteService->generateMotorRiskNoteContent($motorRiskNote);
        }

        $uploadedLabels = $motorRiskNote->documents()
            ->pluck('name')
            ->map(fn ($name) => trim((string) $name))
            ->all();

        $missing = array_values(array_diff(self::REQUIRED_DOCUMENT_LABELS, $uploadedLabels));
        if ($missing !== []) {
            return back()->withErrors([
                'documents' => 'Upload required documents before submission: '.implode(', ', $missing),
            ]);
        }

        $this->riskNoteService->submitForUnderwriting($motorRiskNote, $user);

        return to_route('motor-risks.show', $motorRiskNote);
    }

    public function approve(RiskNote $motorRiskNote, DecideMedicalRiskNoteRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $motorRiskNote);

        if ($motorRiskNote->status !== RiskNoteService::STATUS_PENDING) {
            return to_route('motor-risks.show', $motorRiskNote);
        }

        $this->riskNoteService->approveUnderwriting(
            $motorRiskNote,
            $user,
            $request->input('decision_notes'),
        );

        return to_route('motor-risks.show', $motorRiskNote);
    }

    public function reject(RiskNote $motorRiskNote, DecideMedicalRiskNoteRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $motorRiskNote);

        if ($motorRiskNote->status !== RiskNoteService::STATUS_PENDING) {
            return to_route('motor-risks.show', $motorRiskNote);
        }

        $this->riskNoteService->rejectUnderwriting(
            $motorRiskNote,
            $user,
            $request->input('decision_notes'),
        );

        return to_route('motor-risks.show', $motorRiskNote);
    }

    public function cancel(RiskNote $motorRiskNote, CancelMedicalRiskNoteRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $this->access->assertCanUnderwriteRiskNote($user, $motorRiskNote);

        if (! in_array($motorRiskNote->status, [RiskNoteService::STATUS_DRAFT, RiskNoteService::STATUS_PENDING], true)) {
            return to_route('motor-risks.show', $motorRiskNote);
        }

        $this->riskNoteService->cancelRiskNote($motorRiskNote, $user, $request->input('reason'));

        return to_route('motor-risks.show', $motorRiskNote);
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

