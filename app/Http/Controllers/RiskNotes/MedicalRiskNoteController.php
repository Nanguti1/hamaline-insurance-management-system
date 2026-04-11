<?php

namespace App\Http\Controllers\RiskNotes;

use App\Http\Controllers\Controller;
use App\Http\Requests\RiskNotes\AssignMedicalMemberNumbersRequest;
use App\Http\Requests\RiskNotes\CancelMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\DecideMedicalRiskNoteRequest;
use App\Http\Requests\RiskNotes\StoreMedicalRiskNoteRequest;
use App\Models\Client;
use App\Models\MedicalMember;
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
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class MedicalRiskNoteController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
        private RiskNoteService $riskNoteService,
    ) {}

    public function index(Request $request): InertiaResponse
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

    public function create(): InertiaResponse
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

    public function show(RiskNote $medicalRiskNote): InertiaResponse
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

    public function downloadPDF(RiskNote $medicalRiskNote, Request $request): Response
    {
        $this->access->assertCanViewRiskNote($request->user(), $medicalRiskNote);

        if (! $medicalRiskNote->risk_note_content) {
            $this->riskNoteService->generateMedicalRiskNoteContent($medicalRiskNote);
        }

        $content = $medicalRiskNote->risk_note_content;
        $content = nl2br($content);

        $html = $this->generatePDFHTML($content, $medicalRiskNote->risk_note_number, 'Medical');

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->stream("{$medicalRiskNote->risk_note_number}.pdf");
    }

    private function generatePDFHTML(string $content, string $riskNoteNumber, string $type): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            padding: 40px;
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            color: #1e40af;
            font-size: 16px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .info-row {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #1e40af;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: left;
        }
        th {
            background: #f3f4f6;
            color: #1e40af;
            font-weight: bold;
        }
        .conditions {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .conditions ul {
            margin: 0;
            padding-left: 20px;
        }
        .notes {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
        }
        .notes ul {
            margin: 0;
            padding-left: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{$type} Risk Note</h1>
        <p>Hamline Insurance Agency</p>
    </div>
    <div class="content">
        {$content}
    </div>
</body>
</html>
HTML;
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
