import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type Metrics = {
    active_policies_count: number;
    clients_count: number;
    premium_total: number;
    claim_total: number;
    claims_ratio?: number;
    policies_per_class?: Array<{ policy_type: string | null; total: number }>;
    expiry_pipeline?: { in_30_days: number; in_60_days: number; in_90_days: number };
    monthly_sales?: Array<{ month: string; policies: number; premium: number }>;
    agent_performance?: Array<{ user_id: number; report_runs: number; user?: { name?: string | null } }>;
};

type RecentReport = {
    id: number;
    title: string;
    generated_at: string;
};

type Props = {
    metrics: Metrics;
    recentReports?: RecentReport[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
    { title: 'Dashboard', href: '/reports/dashboard' },
];

export default function ReportsDashboard({ metrics, recentReports }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Reports & Dashboard" description="Key metrics overview" />

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Active policies</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {metrics.active_policies_count}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Clients</div>
                            <div className="mt-2 text-2xl font-semibold">{metrics.clients_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Premium received</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {Number(metrics.premium_total).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Claims total</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {Number(metrics.claim_total).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Claims ratio</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {Number(metrics.claims_ratio ?? 0).toFixed(2)}%
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Expiring in 30 days</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {metrics.expiry_pipeline?.in_30_days ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Expiring in 60-90 days</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {(metrics.expiry_pipeline?.in_60_days ?? 0) + (metrics.expiry_pipeline?.in_90_days ?? 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium">Policies per class</div>
                        <div className="mt-3 space-y-2">
                            {(metrics.policies_per_class ?? []).length === 0 ? (
                                <div className="text-sm text-muted-foreground">No policy class data yet.</div>
                            ) : (
                                (metrics.policies_per_class ?? []).map((row) => (
                                    <div key={`${row.policy_type ?? 'unknown'}-${row.total}`} className="flex items-center justify-between text-sm">
                                        <span>{row.policy_type ?? 'Unclassified'}</span>
                                        <span className="font-medium">{row.total}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-medium">Recent report runs</div>
                                <div className="text-sm text-muted-foreground">
                                    Latest stored snapshots
                                </div>
                            </div>
                            <Button asChild variant="secondary" size="sm">
                                <Link href="/reports/create">+ Run report</Link>
                            </Button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {(recentReports ?? []).length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    No report runs yet.
                                </div>
                            ) : (
                                (recentReports ?? []).map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{r.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {r.generated_at}
                                            </div>
                                        </div>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/reports/${r.id}`}>View</Link>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

