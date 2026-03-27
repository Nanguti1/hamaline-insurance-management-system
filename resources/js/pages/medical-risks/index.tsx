import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateRange } from '@/lib/date';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Medical Risks', href: '/medical-risks' }];

type RiskNoteRow = {
    id: number;
    risk_note_number: string;
    status: string;
    premium_amount: number | string;
    currency: string;
    start_date?: string | null;
    end_date?: string | null;
    client?: { name?: string | null; company_name?: string | null };
};

type Props = {
    riskNotes?: { data: RiskNoteRow[]; links?: Array<{ url: string | null; label: string; active: boolean }> };
    filters?: { q?: string | null; status?: string | null };
};

export default function MedicalRiskNotesIndex({ riskNotes, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const emptyState = !riskNotes || riskNotes.data.length === 0;
    const resultCount = riskNotes?.data.length ?? 0;

    const pageTitle = useMemo(() => {
        if (!q && !status) return 'Medical Risks';
        return 'Medical Risks • Filtered';
    }, [q, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Medical Risks" description="Underwriting workflow for medical insurance" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/medical-risks/create">+ New Risk Note</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <h2 className="text-sm font-medium">Search</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            className="grid gap-4 md:grid-cols-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(
                                    '/medical-risks',
                                    { q: q || undefined, status: status || undefined },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input id="q" placeholder="Risk note number, notes..." value={q} onChange={(e) => setQ(e.target.value)} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={status || 'all'}
                                    onValueChange={(value) => setStatus(value === 'all' ? '' : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit">Search</Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setQ('');
                                        setStatus('');
                                        router.get('/medical-risks', {}, { replace: true });
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
                        <CardContent className="py-8 text-sm text-muted-foreground">No medical risk notes found.</CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between gap-3 border-b p-4">
                                <div className="text-sm text-muted-foreground">{resultCount} result(s)</div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Risk Note</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Premium</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {riskNotes?.data.map((r) => {
                                        const clientName = r.client?.name ?? r.client?.company_name ?? '-';
                                        const period = formatDateRange(r.start_date, r.end_date);

                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.risk_note_number}</TableCell>
                                                <TableCell>{clientName}</TableCell>
                                                <TableCell className="capitalize">{r.status}</TableCell>
                                                <TableCell>
                                                    {Number(r.premium_amount).toFixed(2)} {r.currency}
                                                </TableCell>
                                                <TableCell>{period}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/medical-risks/${r.id}`}>View</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

