<?php

namespace App\Services\Clients;

use App\Models\Client;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClientService
{
    /**
     * @param  array{q?: string|null, type?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Client::query();

        $q = $filters['q'] ?? null;
        $type = $filters['type'] ?? null;

        if ($type && in_array($type, ['individual', 'corporate'], true)) {
            $query->where('type', $type);
        }

        if ($q) {
            $query->where(function ($subQuery) use ($q) {
                $subQuery
                    ->where('name', 'like', "%{$q}%")
                    ->orWhere('company_name', 'like', "%{$q}%")
                    ->orWhere('id_number', 'like', "%{$q}%")
                    ->orWhere('registration_number', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%")
                    ->orWhere('address', 'like', "%{$q}%");
            });
        }

        return $query
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Client
    {
        return Client::create($this->normalize($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Client $client, array $data): Client
    {
        $client->update($this->normalize($data));

        return $client->refresh();
    }

    public function delete(Client $client): void
    {
        $client->delete();
    }

    /**
     * Normalize nullable string inputs: trim and convert empty strings to null.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        foreach (['name', 'company_name', 'id_number', 'registration_number', 'kra_pin', 'notes', 'address'] as $key) {
            if (array_key_exists($key, $data) && is_string($data[$key])) {
                $data[$key] = trim($data[$key]);
                if ($data[$key] === '') {
                    $data[$key] = null;
                }
            }
        }

        return $data;
    }
}

