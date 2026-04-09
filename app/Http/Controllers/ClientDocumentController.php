<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ClientDocumentController extends Controller
{
    public function upload(Request $request, Client $client): JsonResponse
    {
        $request->validate([
            'document_type' => ['required', 'in:national_id,kra_pin,other'],
            'file' => ['required', 'file', 'max:10240'], // 10MB max
        ]);

        $file = $request->file('file');
        $documentType = $request->input('document_type');

        // Check if required document type already exists
        if (in_array($documentType, ['national_id', 'kra_pin'])) {
            $existing = $client->documents()
                ->where('document_type', $documentType)
                ->first();

            if ($existing) {
                // Delete old file
                Storage::disk('public')->delete($existing->file_path);
                $existing->delete();
            }
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $filePath = $file->storeAs('client-documents/'.$client->id, $filename, 'public');

        $document = $client->documents()->create([
            'document_type' => $documentType,
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'file_path' => $filePath,
            'is_required' => in_array($documentType, ['national_id', 'kra_pin']),
        ]);

        return response()->json([
            'success' => true,
            'document' => $document,
            'download_url' => Storage::disk('public')->url($filePath),
        ]);
    }

    public function delete(Request $request, Client $client, ClientDocument $document): JsonResponse
    {
        if ($document->client_id !== $client->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json(['success' => true]);
    }

    public function download(Request $request, Client $client, ClientDocument $document)
    {
        if ($document->client_id !== $client->id) {
            abort(403);
        }

        $filePath = Storage::disk('public')->path($document->file_path);

        if (! file_exists($filePath)) {
            abort(404);
        }

        return response()->download($filePath, $document->original_filename);
    }

    public function checkRequirements(Client $client): JsonResponse
    {
        $requiredTypes = ['national_id', 'kra_pin'];
        $uploadedDocuments = $client->documents()
            ->whereIn('document_type', $requiredTypes)
            ->pluck('document_type')
            ->toArray();

        $missing = array_diff($requiredTypes, $uploadedDocuments);

        return response()->json([
            'all_required_uploaded' => empty($missing),
            'missing_documents' => array_values($missing),
            'uploaded_documents' => $uploadedDocuments,
        ]);
    }
}
