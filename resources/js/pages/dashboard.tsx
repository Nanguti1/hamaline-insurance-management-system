import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
];

type Metrics = {
    active_policies_count: number;
    clients_count: number;
    premium_total: number;
    claim_total: number;
};

type RecentReport = {
    id: number;
    title: string;
    generated_at: string;
};

type Props = {
    metrics?: Metrics;
    recentReports?: RecentReport[];
    showReportsSection?: boolean;
};

export default function Dashboard({ metrics, recentReports, showReportsSection = true }: Props) {
    const overview = metrics ?? {
        active_policies_count: 0,
        clients_count: 0,
        premium_total: 0,
        claim_total: 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-background p-4">
                <Heading
                    title="Dashboard"
                    description="Operational snapshot across policies, premiums, clients, and claims"
                />

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-surface/70">
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Active policies</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {overview.active_policies_count}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-surface/70">
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Clients</div>
                            <div className="mt-2 text-2xl font-semibold">{overview.clients_count}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-surface/70">
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Premium received</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {Number(overview.premium_total).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-surface/70">
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Claims total</div>
                            <div className="mt-2 text-2xl font-semibold">
                                {Number(overview.claim_total).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {showReportsSection ? (
                    <Card className="border-primary/10 bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-medium">Recent report runs</div>
                                    <div className="text-sm text-muted-foreground">
                                        Latest stored snapshots
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href="/reports/dashboard">View reports dashboard</Link>
                                    </Button>
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href="/reports/create">+ Run report</Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {(recentReports ?? []).length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No report runs yet.</div>
                                ) : (
                                    (recentReports ?? []).map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2"
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
                ) : null}
            </div>
        </AppLayout>
    );
}
