<?php

namespace App\Services\Reports;

use App\Models\Claim;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Policy;
use App\Models\ReportRun;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportsService
{
    /**
     * Create a stored report snapshot based on requested report_type + filters.
     *
     * @param  array<string, mixed>  $data
     */
    public function runReport(array $data, User $user): ReportRun
    {
        $reportType = (string) ($data['report_type'] ?? 'overview');
        $reportData = $this->computeReportData($reportType, $data, $user);

        // Keep existing overview columns populated for compatibility.
        $policyScope = $this->policyScopeQuery($user, $data, applyPolicyDate: true);

        $activePoliciesCount = (clone $policyScope)->where('status', 'active')->count();
        $clientsCount = (clone $policyScope)->distinct('client_id')->count();

        // premium/claims totals are report-specific; we provide best-effort overall.
        $premiumTotal = (float) DB::table('payments')
            ->join('policies', 'policies.id', '=', 'payments.policy_id')
            ->where('payments.status', 'received')
            ->when($data['status'] ?? null, fn ($q) => $q->where('policies.status', $data['status']))
            ->when($data['policy_type'] ?? null, fn ($q) => $q->where('policies.policy_type', $data['policy_type']))
            ->when($data['client_type'] ?? null, fn ($q) => $q->where('policies.client_id', fn ($sq) => $sq->select('id')->from('clients')->where('type', $data['client_type'])))
            ->when($data['range_start'] ?? null && $data['range_end'] ?? null, function ($q) use ($data) {
                $q->whereBetween('payments.paid_at', [$data['range_start'], $data['range_end']]);
            })
            ->where(function ($q) use ($user) {
                if ($user->hasRole('client')) {
                    $clientId = $user->clientRecord?->id;
                    $q->where('policies.client_id', $clientId);
                } elseif ($user->hasRole('underwriter')) {
                    $uwId = $user->underwriterProfile?->id;
                    $q->where('policies.underwriter_id', $uwId);
                }
            })
            ->sum('payments.amount');

        $claimTotal = (float) DB::table('claims')
            ->join('policies', 'policies.id', '=', 'claims.policy_id')
            ->when($data['status'] ?? null, fn ($q) => $q->where('policies.status', $data['status']))
            ->when($data['policy_type'] ?? null, fn ($q) => $q->where('policies.policy_type', $data['policy_type']))
            ->when($data['client_type'] ?? null, fn ($q) => $q->where('policies.client_id', fn ($sq) => $sq->select('id')->from('clients')->where('type', $data['client_type'])))
            ->when($data['range_start'] ?? null && $data['range_end'] ?? null, function ($q) use ($data) {
                $q->whereBetween('claims.reported_at', [$data['range_start'], $data['range_end']]);
            })
            ->where(function ($q) use ($user) {
                if ($user->hasRole('client')) {
                    $clientId = $user->clientRecord?->id;
                    $q->where('policies.client_id', $clientId);
                } elseif ($user->hasRole('underwriter')) {
                    $uwId = $user->underwriterProfile?->id;
                    $q->where('policies.underwriter_id', $uwId);
                }
            })
            ->sum('claims.claim_amount');

        return ReportRun::create([
            'user_id' => $user->getKey(),
            'report_type' => $reportType,
            'title' => $data['title'],
            'range_start' => $data['range_start'] ?? null,
            'range_end' => $data['range_end'] ?? null,
            'filter_client_type' => $data['client_type'] ?? null,
            'filter_policy_type' => $data['policy_type'] ?? null,
            'filter_status' => $data['status'] ?? null,
            'active_policies_count' => $activePoliciesCount,
            'clients_count' => $clientsCount,
            'premium_total' => $premiumTotal,
            'claim_total' => $claimTotal,
            'generated_at' => now(),
            'notes' => $data['notes'] ?? null,
            'report_data' => $reportData,
        ]);
    }

    /**
     * @param  array{range_start?: string|null, range_end?: string|null}  $filters
     * @return array<string, mixed>
     */
    public function computeDashboardMetrics(User $user, array $filters = []): array
    {
        if ($user->hasRole('admin')) {
            return $this->computeOverview($filters);
        }

        if ($user->hasRole('client')) {
            return $this->computeClientDashboardMetrics($user, $filters);
        }

        if ($user->hasRole('underwriter')) {
            return $this->computeUnderwriterDashboardMetrics($user, $filters);
        }

        return $this->emptyDashboardMetrics();
    }

    /**
     * @param  array{range_start?: string|null, range_end?: string|null}  $filters
     * @return array<string, mixed>
     */
    private function computeClientDashboardMetrics(User $user, array $filters): array
    {
        $base = $this->emptyDashboardMetrics();
        $clientId = $user->clientRecord?->id;
        if (! $clientId) {
            return $base;
        }

        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        $policyQuery = Policy::query()->where('client_id', $clientId);
        $base['active_policies_count'] = (clone $policyQuery)->where('status', 'active')->count();
        $base['clients_count'] = 1;

        $premiumQuery = Payment::query()
            ->where('status', 'received')
            ->whereHas('policy', fn ($p) => $p->where('client_id', $clientId));

        $claimQuery = Claim::query()->whereHas('policy', fn ($p) => $p->where('client_id', $clientId));

        if ($rangeStart && $rangeEnd) {
            $premiumQuery->whereBetween('paid_at', [$rangeStart, $rangeEnd]);
            $claimQuery->whereBetween('reported_at', [$rangeStart, $rangeEnd]);
        }

        $premiumSum = (float) $premiumQuery->sum('amount');
        $claimSum = (float) $claimQuery->sum('claim_amount');

        $base['premium_total'] = $premiumSum;
        $base['claim_total'] = $claimSum;
        $base['claims_ratio'] = $premiumSum > 0 ? (float) (($claimSum / $premiumSum) * 100) : 0.0;

        return $base;
    }

    /**
     * @param  array{range_start?: string|null, range_end?: string|null}  $filters
     * @return array<string, mixed>
     */
    private function computeUnderwriterDashboardMetrics(User $user, array $filters): array
    {
        $base = $this->emptyDashboardMetrics();
        $uwId = $user->underwriterProfile?->id;
        if (! $uwId) {
            return $base;
        }

        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        $policyQuery = Policy::query()->where('underwriter_id', $uwId);
        $base['active_policies_count'] = (clone $policyQuery)->where('status', 'active')->count();
        $base['clients_count'] = (int) Policy::query()
            ->where('underwriter_id', $uwId)
            ->distinct()
            ->count('client_id');

        $premiumQuery = Payment::query()
            ->where('status', 'received')
            ->whereHas('policy', fn ($p) => $p->where('underwriter_id', $uwId));

        $claimQuery = Claim::query()->whereHas('policy', fn ($p) => $p->where('underwriter_id', $uwId));

        if ($rangeStart && $rangeEnd) {
            $premiumQuery->whereBetween('paid_at', [$rangeStart, $rangeEnd]);
            $claimQuery->whereBetween('reported_at', [$rangeStart, $rangeEnd]);
        }

        $premiumSum = (float) $premiumQuery->sum('amount');
        $claimSum = (float) $claimQuery->sum('claim_amount');

        $base['premium_total'] = $premiumSum;
        $base['claim_total'] = $claimSum;
        $base['claims_ratio'] = $premiumSum > 0 ? (float) (($claimSum / $premiumSum) * 100) : 0.0;

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyDashboardMetrics(): array
    {
        return [
            'active_policies_count' => 0,
            'clients_count' => 0,
            'premium_total' => 0.0,
            'claim_total' => 0.0,
            'claims_ratio' => 0.0,
            'policies_per_class' => collect(),
            'expiry_pipeline' => [
                'in_30_days' => 0,
                'in_60_days' => 0,
                'in_90_days' => 0,
            ],
            'monthly_sales' => collect(),
            'agent_performance' => collect(),
        ];
    }

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
    public function recompute(ReportRun $reportRun, array $data, User $user): ReportRun
    {
        $reportType = (string) ($data['report_type'] ?? $reportRun->report_type ?? 'overview');

        $reportData = $this->computeReportData($reportType, $data, $user);
        $policyScope = $this->policyScopeQuery($user, $data, applyPolicyDate: true);

        $activePoliciesCount = (clone $policyScope)->where('status', 'active')->count();
        $clientsCount = (clone $policyScope)->distinct('client_id')->count();

        // Best-effort overall totals (primarily for backward compatibility in UI).
        $premiumTotal = (float) DB::table('payments')
            ->join('policies', 'policies.id', '=', 'payments.policy_id')
            ->where('payments.status', 'received')
            ->when($data['status'] ?? null, fn ($q) => $q->where('policies.status', $data['status']))
            ->when($data['policy_type'] ?? null, fn ($q) => $q->where('policies.policy_type', $data['policy_type']))
            ->when($data['client_type'] ?? null, fn ($q) => $q->where('policies.client_id', fn ($sq) => $sq->select('id')->from('clients')->where('type', $data['client_type'])))
            ->when($data['range_start'] ?? null && $data['range_end'] ?? null, function ($q) use ($data) {
                $q->whereBetween('payments.paid_at', [$data['range_start'], $data['range_end']]);
            })
            ->where(function ($q) use ($user) {
                if ($user->hasRole('client')) {
                    $clientId = $user->clientRecord?->id;
                    $q->where('policies.client_id', $clientId);
                } elseif ($user->hasRole('underwriter')) {
                    $uwId = $user->underwriterProfile?->id;
                    $q->where('policies.underwriter_id', $uwId);
                }
            })
            ->sum('payments.amount');

        $claimTotal = (float) DB::table('claims')
            ->join('policies', 'policies.id', '=', 'claims.policy_id')
            ->when($data['status'] ?? null, fn ($q) => $q->where('policies.status', $data['status']))
            ->when($data['policy_type'] ?? null, fn ($q) => $q->where('policies.policy_type', $data['policy_type']))
            ->when($data['client_type'] ?? null, fn ($q) => $q->where('policies.client_id', fn ($sq) => $sq->select('id')->from('clients')->where('type', $data['client_type'])))
            ->when($data['range_start'] ?? null && $data['range_end'] ?? null, function ($q) use ($data) {
                $q->whereBetween('claims.reported_at', [$data['range_start'], $data['range_end']]);
            })
            ->where(function ($q) use ($user) {
                if ($user->hasRole('client')) {
                    $clientId = $user->clientRecord?->id;
                    $q->where('policies.client_id', $clientId);
                } elseif ($user->hasRole('underwriter')) {
                    $uwId = $user->underwriterProfile?->id;
                    $q->where('policies.underwriter_id', $uwId);
                }
            })
            ->sum('claims.claim_amount');

        $reportRun->update([
            'report_type' => $reportType,
            'title' => $data['title'],
            'range_start' => $data['range_start'] ?? null,
            'range_end' => $data['range_end'] ?? null,
            'filter_client_type' => $data['client_type'] ?? null,
            'filter_policy_type' => $data['policy_type'] ?? null,
            'filter_status' => $data['status'] ?? null,
            'active_policies_count' => $activePoliciesCount,
            'clients_count' => $clientsCount,
            'premium_total' => $premiumTotal,
            'claim_total' => $claimTotal,
            'generated_at' => now(),
            'notes' => $data['notes'] ?? null,
            'report_data' => $reportData,
        ]);

        return $reportRun->refresh();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeReportData(string $reportType, array $filters, User $user): array
    {
        return match ($reportType) {
            'policies_by_type' => $this->computePoliciesByType($filters, $user),
            'active_vs_cancelled_policies' => $this->computeActiveVsCancelledPolicies($filters, $user),
            'claims_summary' => $this->computeClaimsSummary($filters, $user),
            'premium_collected' => $this->computePremiumCollected($filters, $user),
            'corporate_employee_coverage' => $this->computeCorporateEmployeeCoverage($filters, $user),
            'underwriter_performance' => $this->computeUnderwriterPerformance($filters, $user),
            default => $this->computeOverview([
                'range_start' => $filters['range_start'] ?? null,
                'range_end' => $filters['range_end'] ?? null,
            ]),
        };
    }

    /**
     * @return Builder<Policy>
     */
    private function policyScopeQuery(User $user, array $filters, bool $applyPolicyDate): Builder
    {
        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        /** @var Builder<Policy> $q */
        $q = Policy::query();

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;
            if ($clientId) {
                $q->where('client_id', $clientId);
            } else {
                $q->whereRaw('0 = 1');
            }
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if ($uwId) {
                $q->where('underwriter_id', $uwId);
            } else {
                $q->whereRaw('0 = 1');
            }
        }

        if ($applyPolicyDate && $rangeStart && $rangeEnd) {
            $q->whereBetween('start_date', [$rangeStart, $rangeEnd]);
        }

        if (! empty($filters['policy_type'])) {
            $q->where('policy_type', (string) $filters['policy_type']);
        }

        if (! empty($filters['status'])) {
            $q->where('status', (string) $filters['status']);
        }

        if (! empty($filters['client_type'])) {
            $clientType = (string) $filters['client_type'];
            $q->whereHas('client', fn (Builder $c) => $c->where('type', $clientType));
        }

        return $q;
    }

    /**
     * @return Builder<Policy>
     */
    private function applyPolicyScopeFilters(Builder $q, User $user, array $filters, bool $applyPolicyDate): Builder
    {
        $policyScope = $this->policyScopeQuery($user, $filters, applyPolicyDate: $applyPolicyDate);

        // Eloquent Builders can't be cloned with where-walk easily; we just return the built query instead.
        return $policyScope;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computePoliciesByType(array $filters, User $user): array
    {
        $q = $this->policyScopeQuery($user, $filters, applyPolicyDate: true);

        $rows = $q->select('policy_type', DB::raw('COUNT(*) as total'))
            ->groupBy('policy_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'policy_type' => $r->policy_type,
                'total' => (int) $r->total,
            ])
            ->values()
            ->all();

        return ['rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeActiveVsCancelledPolicies(array $filters, User $user): array
    {
        $q = $this->policyScopeQuery($user, $filters, applyPolicyDate: true);

        $counts = $q->whereIn('status', ['active', 'cancelled'])
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($r) => [(string) $r->status => (int) $r->total])
            ->all();

        return [
            'active' => $counts['active'] ?? 0,
            'cancelled' => $counts['cancelled'] ?? 0,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeClaimsSummary(array $filters, User $user): array
    {
        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        $q = Claim::query();

        if ($rangeStart && $rangeEnd) {
            $q->whereBetween('reported_at', [$rangeStart, $rangeEnd]);
        }

        $q->whereHas('policy', function (Builder $p) use ($filters, $user) {
            // Apply policy filters but do NOT apply policy date; claim date is the report range.
            $this->applyPolicyScopeFiltersToPolicyQuery($p, $user, $filters);
        });

        $totalCount = (int) (clone $q)->count();
        $totalAmount = (float) (clone $q)->sum('claim_amount');

        $byStatus = (clone $q)->select('status', DB::raw('COUNT(*) as total'), DB::raw('SUM(claim_amount) as amount'))
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->status,
                'total' => (int) $r->total,
                'amount' => (float) $r->amount,
            ])
            ->values()
            ->all();

        return [
            'total_count' => $totalCount,
            'total_amount' => $totalAmount,
            'by_status' => $byStatus,
        ];
    }

    private function applyPolicyScopeFiltersToPolicyQuery(Builder $pQuery, User $user, array $filters): void
    {
        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;
            if ($clientId) {
                $pQuery->where('client_id', $clientId);
            } else {
                $pQuery->whereRaw('0 = 1');
            }
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if ($uwId) {
                $pQuery->where('underwriter_id', $uwId);
            } else {
                $pQuery->whereRaw('0 = 1');
            }
        }

        if (! empty($filters['policy_type'])) {
            $pQuery->where('policy_type', (string) $filters['policy_type']);
        }

        if (! empty($filters['status'])) {
            $pQuery->where('status', (string) $filters['status']);
        }

        if (! empty($filters['client_type'])) {
            $clientType = (string) $filters['client_type'];
            $pQuery->whereHas('client', fn (Builder $c) => $c->where('type', $clientType));
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computePremiumCollected(array $filters, User $user): array
    {
        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        $q = Payment::query()->where('status', 'received');

        if ($rangeStart && $rangeEnd) {
            $q->whereBetween('paid_at', [$rangeStart, $rangeEnd]);
        }

        $q->whereHas('policy', function (Builder $p) use ($filters, $user) {
            $this->applyPolicyScopeFiltersToPolicyQuery($p, $user, $filters);
        });

        $totalAmount = (float) (clone $q)->sum('amount');
        $paymentCount = (int) (clone $q)->count();

        return [
            'total_amount' => $totalAmount,
            'payment_count' => $paymentCount,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeCorporateEmployeeCoverage(array $filters, User $user): array
    {
        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        // Corporate employee coverage is WIBA-specific (employees covered via WIBA risk notes/policies).
        $q = DB::table('wiba_employees as we')
            ->join('risk_notes as rn', 'rn.id', '=', 'we.risk_note_id')
            ->join('policies as p', 'p.id', '=', 'rn.policy_id')
            ->join('clients as c', 'c.id', '=', 'p.client_id')
            ->where('rn.line_type', 'wiba');

        if ($rangeStart && $rangeEnd) {
            $q->whereBetween('p.start_date', [$rangeStart, $rangeEnd]);
        }

        if (! empty($filters['status'])) {
            $q->where('p.status', (string) $filters['status']);
        }

        if (! empty($filters['policy_type'])) {
            $q->where('p.policy_type', (string) $filters['policy_type']);
        }

        if (! empty($filters['client_type'])) {
            $q->where('c.type', (string) $filters['client_type']);
        } else {
            // Spec says corporate employee coverage is for corporates.
            $q->where('c.type', 'corporate');
        }

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;
            if ($clientId) {
                $q->where('p.client_id', $clientId);
            } else {
                $q->whereRaw('0 = 1');
            }
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if ($uwId) {
                $q->where('p.underwriter_id', $uwId);
            } else {
                $q->whereRaw('0 = 1');
            }
        }

        $rows = $q->select(
            'c.id as client_id',
            DB::raw('COALESCE(c.company_name, c.name) as client_name'),
            DB::raw('COUNT(we.id) as employee_count')
        )
            ->groupBy('c.id', 'client_name')
            ->orderByDesc('employee_count')
            ->get()
            ->map(fn ($r) => [
                'client_id' => (int) $r->client_id,
                'client_name' => (string) $r->client_name,
                'employee_count' => (int) $r->employee_count,
            ])
            ->values()
            ->all();

        return ['rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeUnderwriterPerformance(array $filters, User $user): array
    {
        $rangeStart = $filters['range_start'] ?? null;
        $rangeEnd = $filters['range_end'] ?? null;

        $base = DB::table('policies as p')
            ->join('underwriters as u', 'u.id', '=', 'p.underwriter_id')
            ->leftJoin('payments as pay', function ($join) {
                $join->on('pay.policy_id', '=', 'p.id')->where('pay.status', '=', 'received');
            })
            ->leftJoin('claims as cl', function ($join) {
                $join->on('cl.policy_id', '=', 'p.id');
            });

        if ($rangeStart && $rangeEnd) {
            $base->whereBetween('p.start_date', [$rangeStart, $rangeEnd]);
        }

        if (! empty($filters['policy_type'])) {
            $base->where('p.policy_type', (string) $filters['policy_type']);
        }

        if (! empty($filters['status'])) {
            $base->where('p.status', (string) $filters['status']);
        }

        if (! empty($filters['client_type'])) {
            $base->join('clients as c', 'c.id', '=', 'p.client_id')
                ->where('c.type', (string) $filters['client_type']);
        }

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;
            if ($clientId) {
                $base->where('p.client_id', $clientId);
            } else {
                $base->whereRaw('0 = 1');
            }
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if ($uwId) {
                $base->where('p.underwriter_id', $uwId);
            } else {
                $base->whereRaw('0 = 1');
            }
        }

        $rows = $base->select(
            'u.id as underwriter_id',
            'u.name as underwriter_name',
            DB::raw('COUNT(p.id) as policies_count'),
            DB::raw('SUM(pay.amount) as premium_total'),
            DB::raw('SUM(cl.claim_amount) as claim_total'),
            DB::raw('SUM(CASE WHEN p.status = "active" THEN 1 ELSE 0 END) as active_policies_count'),
            DB::raw('SUM(CASE WHEN p.status = "cancelled" THEN 1 ELSE 0 END) as cancelled_policies_count')
        )
            ->groupBy('u.id', 'u.name')
            ->orderByDesc('premium_total')
            ->get()
            ->map(function ($r) {
                $premiumTotal = (float) ($r->premium_total ?? 0);
                $claimTotal = (float) ($r->claim_total ?? 0);
                $claimsRatio = $premiumTotal > 0 ? (($claimTotal / $premiumTotal) * 100) : 0.0;

                return [
                    'underwriter_id' => (int) $r->underwriter_id,
                    'underwriter_name' => (string) $r->underwriter_name,
                    'policies_count' => (int) $r->policies_count,
                    'premium_total' => $premiumTotal,
                    'claim_total' => $claimTotal,
                    'claims_ratio' => $claimsRatio,
                    'active_policies_count' => (int) $r->active_policies_count,
                    'cancelled_policies_count' => (int) $r->cancelled_policies_count,
                ];
            })
            ->values()
            ->all();

        return ['rows' => $rows];
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
