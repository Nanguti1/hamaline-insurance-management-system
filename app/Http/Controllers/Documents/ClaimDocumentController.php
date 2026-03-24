<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Document;
use App\Services\Access\ResourceAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClaimDocumentController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function store(Request $request, Claim $claim): RedirectResponse
    {
        $this->access->assertCanViewClaim($request->user(), $claim);

        $validated = $request->validate([
            'document' => ['required', 'file', 'max:10240'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $validated['document'];
        $path = $file->store('claim-documents', 'public');

        $claim->documents()->create([
            'uploaded_by' => $request->user()?->id,
            'name' => $validated['name'] ?: $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize() ?? 0,
        ]);

        return back();
    }

    public function destroy(Request $request, Claim $claim, Document $document): RedirectResponse
    {
        $this->access->assertCanViewClaim($request->user(), $claim);

        if ($document->documentable_type !== Claim::class || (int) $document->documentable_id !== (int) $claim->id) {
            abort(404);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return back();
    }
}
