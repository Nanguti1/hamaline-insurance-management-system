<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Models\Client;
use App\Services\Clients\ClientService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request, ClientService $service): Response
    {
        $clients = $service->paginate([
            'q' => $request->query('q'),
            'type' => $request->query('type'),
        ]);

        return Inertia::render('clients/index', [
            'clients' => $clients,
            'filters' => [
                'q' => $request->query('q'),
                'type' => $request->query('type'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('clients/create');
    }

    public function store(StoreClientRequest $request, ClientService $service): RedirectResponse
    {
        $client = $service->create($request->validated());

        return to_route('clients.show', $client);
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

        return to_route('clients.show', $client);
    }

    public function destroy(Client $client, ClientService $service): RedirectResponse
    {
        $service->delete($client);

        return to_route('clients.index');
    }
}

