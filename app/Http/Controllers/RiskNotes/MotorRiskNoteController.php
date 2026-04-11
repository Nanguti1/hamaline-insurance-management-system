<?php

namespace App\Http\Controllers\RiskNotes;

use App\Http\Controllers\RiskNotes\Concerns\BuildsRiskNotePdfHtml;
use App\Http\Controllers\Controller;
use App\Http\Requests\RiskNotes\CancelMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\DecideMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\StoreMotorRiskNoteRequest;
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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class MotorRiskNoteController extends Controller
{
    use BuildsRiskNotePdfHtml;

    private const REQUIRED_DOCUMENT_LABELS = ['Log book', 'ID copy', 'KRA PIN'];

    public function __construct(
        private ResourceAccessService $access,
        private RiskNoteService $riskNoteService,
    ) {}

    public function index(Request $request): InertiaResponse
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

    public function create(): InertiaResponse
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

    public function show(RiskNote $motorRiskNote): InertiaResponse
    {
        $this->access->assertCanViewRiskNote(Auth::user(), $motorRiskNote);

        $motorRiskNote->load([
            'client',
            'client.documents',
            'underwriter',
            'motorDetails',
            'underwritingDecisions',
            'policy',
            'documents',
        ]);

        $riskNoteDocuments = $motorRiskNote->documents->map(fn ($doc) => [
            'id' => $doc->id,
            'name' => $doc->name,
            'url' => Storage::url($doc->file_path),
            'mime_type' => $doc->mime_type,
            'size' => $doc->size,
            'source' => 'risk_note',
        ]);

        $clientRequiredDocuments = $motorRiskNote->client?->documents
            ?->whereIn('document_type', ['national_id', 'kra_pin'])
            ->map(fn ($doc) => [
                'id' => -1 * (int) $doc->id,
                'name' => $doc->document_type === 'national_id' ? 'ID copy' : 'KRA PIN',
                'url' => route('clients.documents.download', [
                    'client' => $motorRiskNote->client_id,
                    'document' => $doc->id,
                ]),
                'mime_type' => $doc->mime_type,
                'size' => $doc->size,
                'source' => 'client',
            ]) ?? collect();

        if ($motorRiskNote->client?->id_number && $clientRequiredDocuments->doesntContain('name', 'ID copy')) {
            $clientRequiredDocuments->push([
                'id' => -1000000 - (int) $motorRiskNote->client_id,
                'name' => 'ID copy',
                'url' => null,
                'mime_type' => null,
                'size' => 0,
                'source' => 'client',
            ]);
        }

        if ($motorRiskNote->client?->kra_pin && $clientRequiredDocuments->doesntContain('name', 'KRA PIN')) {
            $clientRequiredDocuments->push([
                'id' => -2000000 - (int) $motorRiskNote->client_id,
                'name' => 'KRA PIN',
                'url' => null,
                'mime_type' => null,
                'size' => 0,
                'source' => 'client',
            ]);
        }

        $documents = $riskNoteDocuments
            ->concat($clientRequiredDocuments)
            ->unique('name')
            ->values();

        return Inertia::render('motor-risks/show', [
            'riskNote' => $motorRiskNote,
            'documents' => $documents,
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

    public function downloadPDF(RiskNote $motorRiskNote, Request $request): Response
    {
        $this->access->assertCanViewRiskNote($request->user(), $motorRiskNote);

        if (! $motorRiskNote->risk_note_content) {
            $this->riskNoteService->generateMotorRiskNoteContent($motorRiskNote);
        }

        $html = $this->buildRiskNotePdfHtml(
            $motorRiskNote->risk_note_content ?? '',
            'Motor',
            $motorRiskNote->risk_note_number,
            $motorRiskNote->insurer?->name ?? '-',
        );

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->stream("{$motorRiskNote->risk_note_number}.pdf");
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

        $client = $motorRiskNote->client()->with(['documents'])->first();
        $clientLabels = $client?->documents
            ->whereIn('document_type', ['national_id', 'kra_pin'])
            ->map(fn ($doc) => $doc->document_type === 'national_id' ? 'ID copy' : 'KRA PIN')
            ->values()
            ->all() ?? [];
        if ($client?->id_number && ! in_array('ID copy', $clientLabels, true)) {
            $clientLabels[] = 'ID copy';
        }
        if ($client?->kra_pin && ! in_array('KRA PIN', $clientLabels, true)) {
            $clientLabels[] = 'KRA PIN';
        }

        $uploadedLabels = array_values(array_unique(array_merge($uploadedLabels, $clientLabels)));

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
     * @return Collection<int, array{id:int,name:string|null}>
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
