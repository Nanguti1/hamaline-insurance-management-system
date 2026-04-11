<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clients\StoreClientMedicalCategoryRequest;
use App\Http\Requests\Clients\UpdateClientMedicalCategoryRequest;
use App\Models\ClientMedicalCategory;
use Illuminate\Http\JsonResponse;

class ClientMedicalCategoryController extends Controller
{
    public function index($clientId): JsonResponse
    {
        $categories = ClientMedicalCategory::where('client_id', $clientId)
            ->where('is_active', true)
            ->orderBy('category_code')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function store(StoreClientMedicalCategoryRequest $request, $clientId): JsonResponse
    {
        $validated = $request->validated();

        $exists = ClientMedicalCategory::query()
            ->where('client_id', $clientId)
            ->where('category_code', $validated['category_code'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This category code already exists for this client.',
            ], 422);
        }

        $category = ClientMedicalCategory::create([
            'client_id' => $clientId,
            'category_code' => $validated['category_code'],
            'category_name' => $validated['category_name'],
            'category_identifier' => $validated['category_identifier'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'data' => $category,
        ]);
    }

    public function update(UpdateClientMedicalCategoryRequest $request, $clientId, $id): JsonResponse
    {
        $category = ClientMedicalCategory::where('client_id', $clientId)->findOrFail($id);

        $validated = $request->validated();

        $exists = ClientMedicalCategory::query()
            ->where('client_id', $clientId)
            ->where('category_code', $validated['category_code'])
            ->where('id', '!=', $category->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This category code already exists for this client.',
            ], 422);
        }

        $category->update($validated);

        return response()->json([
            'data' => $category,
        ]);
    }

    public function destroy($clientId, $id): JsonResponse
    {
        $category = ClientMedicalCategory::where('client_id', $clientId)->findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully',
        ]);
    }
}
