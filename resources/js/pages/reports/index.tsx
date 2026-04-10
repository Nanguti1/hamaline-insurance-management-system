import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog';
import { deleteResource } from '@/lib/delete-resource';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
];

type ReportRow = {
    id: number;
    title: string;
    report_type: string;
    generated_at: string;
    active_policies_count: number;
    clients_count: number;
    premium_total: number | string;
    claim_total: number | string;
};

type Props = {
    reports?: { data: ReportRow[]; links?: Array<{ url: string | null; label: string; active: boolean }> };
    filters?: { q?: string | null };
};

export default function ReportsIndex({ reports, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const emptyState = !reports || reports.data.length === 0;

    const pageTitle = useMemo(() => {
        if (!q) return 'Reports';
        return 'Reports • Filtered';
    }, [q]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Reports" description="Saved report snapshots" />
                <div className="flex justify-end gap-2">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/reports/dashboard">Open dashboard</Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/reports/create">+ Add Report Run</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <h2 className="text-sm font-medium">Search</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            className="grid gap-2 md:grid-cols-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get('/reports', { q: q || undefined }, { preserveState: true, replace: true });
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input id="q" placeholder="Title, report type..." value={q} onChange={(e) => setQ(e.target.value)} />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit">Search</Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setQ('');
                                        router.get('/reports', {}, { replace: true });
                                    }}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {emptyState ? (
                    <Card>
                        <CardContent className="py-8 text-sm text-muted-foreground">
                            No report runs found.
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between gap-3 border-b p-4">
                                <div className="text-sm text-muted-foreground">
                                    {reports?.data.length ?? 0} result(s)
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href="/reports/create">+ Run report</Link>
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Generated</TableHead>
                                        <TableHead>Policies</TableHead>
                                        <TableHead>Premium</TableHead>
                                        <TableHead>Claims</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports?.data.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">{r.title}</TableCell>
                                            <TableCell>{r.generated_at}</TableCell>
                                            <TableCell>{r.active_policies_count}</TableCell>
                                            <TableCell>{Number(r.premium_total).toFixed(2)}</TableCell>
                                            <TableCell>{Number(r.claim_total).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/reports/${r.id}`}>View</Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/reports/${r.id}/edit`}>Edit</Link>
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">Delete</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogDescription>
                                                                    Delete report &ldquo;{r.title}&rdquo;?
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="secondary">Cancel</Button>
                                                                </DialogClose>
                                                                <Button
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    deleteResource(
                                                                        `/reports/${r.id}`,
                                                                        'Report deleted successfully.',
                                                                    )
                                                                }
                                                            >
                                                                    Confirm delete
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

