<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\StoreReportRunRequest;
use App\Http\Requests\Reports\UpdateReportRunRequest;
use App\Models\ReportRun;
use App\Services\Reports\ReportsService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    public function index(Request $request, ReportsService $service): Response
    {
        $reports = $service->paginate([
            'q' => $request->query('q'),
        ]);

        return Inertia::render('reports/index', [
            'reports' => $reports,
            'filters' => [
                'q' => $request->query('q'),
            ],
        ]);
    }

    public function dashboard(ReportsService $service): Response
    {
        $metrics = $service->computeOverview();

        $recentReports = ReportRun::query()
            ->orderByDesc('generated_at')
            ->limit(5)
            ->get();

        return Inertia::render('reports/dashboard', [
            'metrics' => $metrics,
            'recentReports' => $recentReports,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('reports/create');
    }

    public function store(StoreReportRunRequest $request, ReportsService $service): RedirectResponse
    {
        $report = $service->runReport($request->validated(), $request->user());
        return to_route('reports.show', $report)->with('success', 'Report generated successfully.');
    }

    public function show(ReportRun $reportRun): Response
    {
        return Inertia::render('reports/show', [
            'report' => $reportRun->load('user'),
        ]);
    }

    public function edit(ReportRun $reportRun): Response
    {
        return Inertia::render('reports/edit', [
            'report' => $reportRun,
        ]);
    }

    public function update(UpdateReportRunRequest $request, ReportRun $reportRun, ReportsService $service): RedirectResponse
    {
        $service->recompute($reportRun, $request->validated(), $request->user());
        return to_route('reports.show', $reportRun)->with('success', 'Report updated successfully.');
    }

    public function destroy(ReportRun $reportRun, ReportsService $service): RedirectResponse
    {
        $reportRun->delete();
        return to_route('reports.index');
    }
}

