<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\RiskNote;
use App\Services\Access\ResourceAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class RiskNoteDocumentController extends Controller
{
    private const MOTOR_REQUIRED_DOCUMENTS = [
        'log_book',
        'id_copy',
        'kra_pin',
    ];

    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function store(Request $request, RiskNote $motorRiskNote): RedirectResponse
    {
        if ($motorRiskNote->line_type !== 'motor') {
            abort(404);
        }

        $this->access->assertCanViewRiskNote($request->user(), $motorRiskNote);

        $validated = $request->validate([
            'document' => ['required', 'file', 'max:10240'],
            'document_type' => ['required', 'string', Rule::in(self::MOTOR_REQUIRED_DOCUMENTS)],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $validated['document'];
        $path = $file->store('motor-risk-documents', 'public');

        $name = ($validated['name'] ?? null) ?: $this->labelForType($validated['document_type']);

        $motorRiskNote->documents()->create([
            'uploaded_by' => $request->user()?->id,
            'name' => $name,
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize() ?? 0,
        ]);

        return back();
    }

    public function destroy(Request $request, RiskNote $motorRiskNote, Document $document): RedirectResponse
    {
        if ($motorRiskNote->line_type !== 'motor') {
            abort(404);
        }

        $this->access->assertCanViewRiskNote($request->user(), $motorRiskNote);

        if ($document->documentable_type !== RiskNote::class || (int) $document->documentable_id !== (int) $motorRiskNote->id) {
            abort(404);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return back();
    }

    private function labelForType(string $documentType): string
    {
        return match ($documentType) {
            'log_book' => 'Log book',
            'id_copy' => 'ID copy',
            'kra_pin' => 'KRA PIN',
            default => 'Document',
        };
    }
}
