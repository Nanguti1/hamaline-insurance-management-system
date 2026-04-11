<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Models\ClientMedicalCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function store(Request $request, $clientId): JsonResponse
    {
        $validated = $request->validate([
            'category_code' => ['required', 'string', 'max:10', 'in:A,B,C,D,E,F'],
            'category_name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category = ClientMedicalCategory::create([
            'client_id' => $clientId,
            'category_code' => $validated['category_code'],
            'category_name' => $validated['category_name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'data' => $category,
        ]);
    }

    public function update(Request $request, $clientId, $id): JsonResponse
    {
        $category = ClientMedicalCategory::where('client_id', $clientId)->findOrFail($id);

        $validated = $request->validate([
            'category_code' => ['required', 'string', 'max:10', 'in:A,B,C,D,E,F'],
            'category_name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

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
