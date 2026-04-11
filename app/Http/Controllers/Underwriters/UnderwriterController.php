<?php

namespace App\Http\Controllers\Underwriters;

use App\Http\Controllers\Controller;
use App\Http\Requests\Underwriters\StoreUnderwriterRequest;
use App\Http\Requests\Underwriters\UpdateUnderwriterRequest;
use App\Models\Insurer;
use App\Models\Underwriter;
use App\Services\Underwriters\UnderwriterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnderwriterController extends Controller
{
    public function index(Request $request, UnderwriterService $service): Response
    {
        $underwriters = $service->paginate([
            'q' => $request->query('q'),
        ]);

        return Inertia::render('underwriters/index', [
            'underwriters' => $underwriters,
            'filters' => [
                'q' => $request->query('q'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('underwriters/create', [
            'insurers' => Insurer::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreUnderwriterRequest $request, UnderwriterService $service): RedirectResponse
    {
        $underwriter = $service->create($request->validated());

        return to_route('underwriters.show', $underwriter)->with('success', 'Underwriter created successfully.');
    }

    public function show(Underwriter $underwriter): Response
    {
        return Inertia::render('underwriters/show', [
            'underwriter' => $underwriter,
        ]);
    }

    public function edit(Underwriter $underwriter): Response
    {
        $underwriter->load('insurers:id,name');

        return Inertia::render('underwriters/edit', [
            'underwriter' => $underwriter,
            'insurers' => Insurer::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(UpdateUnderwriterRequest $request, Underwriter $underwriter, UnderwriterService $service): RedirectResponse
    {
        $service->update($underwriter, $request->validated());

        return to_route('underwriters.show', $underwriter)->with('success', 'Underwriter updated successfully.');
    }

    public function destroy(Underwriter $underwriter, UnderwriterService $service): RedirectResponse
    {
        $service->delete($underwriter);

        return to_route('underwriters.index');
    }
}
