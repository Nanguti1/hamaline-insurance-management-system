<?php

namespace App\Services\Reports;

use App\Models\Client;
use App\Models\Payment;
use App\Models\Policy;
use App\Models\Claim;
use App\Models\ReportRun;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

class ReportsService
{
    /**
     * @param  array{q?: string|null}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = ReportRun::query()->with('user');

        $q = $filters['q'] ?? null;
        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('report_type', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($u) use ($q) {
                        $u->where('name', 'like', "%{$q}%")
                            ->orWhere('email', 'like', "%{$q}%");
                    });
            });
        }

        return $query->orderByDesc('generated_at')->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function runOverview(array $data, Model $user): ReportRun
    {
        $rangeStart = $data['range_start'] ?? null;
        $rangeEnd = $data['range_end'] ?? null;

        $metrics = $this->computeOverview([
            'range_start' => $rangeStart,
            'range_end' => $rangeEnd,
        ]);

        return ReportRun::create([
            'user_id' => $user->getKey(),
            'report_type' => 'overview',
            'title' => $data['title'],
            'range_start' => $rangeStart,
            'range_end' => $rangeEnd,
            'active_policies_count' => $metrics['active_policies_count'],
            'clients_count' => $metrics['clients_count'],
            'premium_total' => $metrics['premium_total'],
            'claim_total' => $metrics['claim_total'],
            'generated_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function recompute(ReportRun $reportRun, array $data, Model $user): ReportRun
    {
        $rangeStart = $data['range_start'] ?? null;
        $rangeEnd = $data['range_end'] ?? null;

        $metrics = $this->computeOverview([
            'range_start' => $rangeStart,
            'range_end' => $rangeEnd,
        ]);

        $reportRun->update([
            'report_type' => 'overview',
            'title' => $data['title'],
            'range_start' => $rangeStart,
            'range_end' => $rangeEnd,
            'active_policies_count' => $metrics['active_policies_count'],
            'clients_count' => $metrics['clients_count'],
            'premium_total' => $metrics['premium_total'],
            'claim_total' => $metrics['claim_total'],
            'generated_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        return $reportRun->refresh();
    }

    /**
     * @param  array{range_start?: string|null, range_end?: string|null}  $filters
     * @return array<string, mixed>
     */
    public function computeOverview(array $filters = []): array
    {
        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        $premiumQuery = Payment::query()->where('status', 'received');
        $claimQuery = Claim::query();

        if ($rangeStart && $rangeEnd) {
            $premiumQuery->whereBetween('paid_at', [$rangeStart, $rangeEnd]);
            $claimQuery->whereBetween('reported_at', [$rangeStart, $rangeEnd]);
        }

        return [
            'active_policies_count' => Policy::query()->where('status', 'active')->count(),
            'clients_count' => Client::query()->count(),
            'premium_total' => (float) $premiumQuery->sum('amount'),
            'claim_total' => (float) $claimQuery->sum('claim_amount'),
            'claims_ratio' => $premiumQuery->sum('amount') > 0
                ? (float) (($claimQuery->sum('claim_amount') / $premiumQuery->sum('amount')) * 100)
                : 0.0,
            'policies_per_class' => Policy::query()
                ->select('policy_type', DB::raw('COUNT(*) as total'))
                ->groupBy('policy_type')
                ->orderByDesc('total')
                ->get(),
            'expiry_pipeline' => [
                'in_30_days' => Policy::query()->whereBetween('end_date', [Carbon::today(), Carbon::today()->copy()->addDays(30)])->count(),
                'in_60_days' => Policy::query()->whereBetween('end_date', [Carbon::today()->copy()->addDays(31), Carbon::today()->copy()->addDays(60)])->count(),
                'in_90_days' => Policy::query()->whereBetween('end_date', [Carbon::today()->copy()->addDays(61), Carbon::today()->copy()->addDays(90)])->count(),
            ],
            'monthly_sales' => Policy::query()
                ->selectRaw("DATE_FORMAT(start_date, '%Y-%m') as month, COUNT(*) as policies, SUM(premium_amount) as premium")
                ->groupBy('month')
                ->orderBy('month')
                ->limit(12)
                ->get(),
            'agent_performance' => ReportRun::query()
                ->select('user_id', DB::raw('COUNT(*) as report_runs'))
                ->with('user:id,name')
                ->groupBy('user_id')
                ->orderByDesc('report_runs')
                ->limit(10)
                ->get(),
        ];
    }
}

