<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Models\Client;
use App\Services\Clients\ClientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request, ClientService $service): Response
    {
        $clients = $service->paginate([
            'q' => $request->query('q'),
            'type' => $request->query('type'),
            'policy_type' => $request->query('policy_type'),
            'medical_category' => $request->query('medical_category'),
            'vehicle_use' => $request->query('vehicle_use'),
            'private_use_class' => $request->query('private_use_class'),
            'commercial_class' => $request->query('commercial_class'),
        ]);

        return Inertia::render('clients/index', [
            'clients' => $clients,
            'filters' => [
                'q' => $request->query('q'),
                'type' => $request->query('type'),
                'policy_type' => $request->query('policy_type'),
                'medical_category' => $request->query('medical_category'),
                'vehicle_use' => $request->query('vehicle_use'),
                'private_use_class' => $request->query('private_use_class'),
                'commercial_class' => $request->query('commercial_class'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('clients/create');
    }

    public function store(StoreClientRequest $request, ClientService $service): RedirectResponse
    {
        $validated = $request->validated();
        $client = $service->create(collect($validated)->except([
            'national_id_document',
            'kra_pin_document',
            'other_documents',
        ])->all());

        $this->storeDocument($client, 'national_id', $request->file('national_id_document'));
        $this->storeDocument($client, 'kra_pin', $request->file('kra_pin_document'));

        foreach ($request->file('other_documents', []) as $otherDocument) {
            $this->storeDocument($client, 'other', $otherDocument);
        }

        return to_route('clients.show', $client)->with('success', 'Client created successfully.');
    }

    public function show(Client $client): Response
    {
        return Inertia::render('clients/show', [
            'client' => $client,
        ]);
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('clients/edit', [
            'client' => $client,
        ]);
    }

    public function update(
        UpdateClientRequest $request,
        Client $client,
        ClientService $service
    ): RedirectResponse {
        $service->update($client, $request->validated());

        return to_route('clients.show', $client)->with('success', 'Client updated successfully.');
    }

    public function destroy(Client $client, ClientService $service): RedirectResponse
    {
        $service->delete($client);

        return to_route('clients.index');
    }

    private function storeDocument(Client $client, string $documentType, UploadedFile $file): void
    {
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $filePath = $file->storeAs('client-documents/'.$client->id, $filename, 'public');

        $client->documents()->create([
            'document_type' => $documentType,
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'file_path' => $filePath,
            'is_required' => in_array($documentType, ['national_id', 'kra_pin'], true),
        ]);
    }
}
