<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Policy;
use App\Services\Access\ResourceAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PolicyDocumentController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function store(Request $request, Policy $policy): RedirectResponse
    {
        $this->access->assertCanViewPolicy($request->user(), $policy);

        $validated = $request->validate([
            'documents' => ['nullable', 'array', 'min:1'],
            'documents.*' => ['file', 'max:10240'],
            'document' => ['nullable', 'file', 'max:10240'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        /** @var array<int, UploadedFile> $files */
        $files = $request->file('documents', []);
        if (empty($files) && $request->hasFile('document')) {
            $files = [$request->file('document')];
        }

        if (empty($files)) {
            return back()->withErrors(['documents' => 'Please select at least one file to upload.']);
        }

        foreach ($files as $file) {
            $path = $file->store('policy-documents', 'public');

            $policy->documents()->create([
                'uploaded_by' => $request->user()?->id,
                'name' => ($validated['name'] ?? null) ?: $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize() ?? 0,
            ]);
        }

        return back()->with('success', 'Document uploaded successfully.');
    }

    public function destroy(Request $request, Policy $policy, Document $document): RedirectResponse
    {
        $this->access->assertCanViewPolicy($request->user(), $policy);

        if ($document->documentable_type !== Policy::class || (int) $document->documentable_id !== (int) $policy->id) {
            abort(404);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return back();
    }
}
