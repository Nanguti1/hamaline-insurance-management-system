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
import { formatDateRange } from '@/lib/date';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Policies', href: '/policies' }];

type PolicyRow = {
    id: number;
    policy_number: string;
    status: string;
    premium_amount: number | string;
    currency: string;
    start_date: string;
    end_date: string;
    client?: { name?: string | null; company_name?: string | null };
    underwriter?: { name?: string | null };
};

type Props = {
    policies?: { data: PolicyRow[]; links?: Array<{ url: string | null; label: string; active: boolean }> };
    filters?: { q?: string | null; status?: string | null };
};

export default function PoliciesIndex({ policies, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? '');

    const emptyState = !policies || policies.data.length === 0;
    const resultCount = policies?.data.length ?? 0;

    const pageTitle = useMemo(() => {
        if (!q && !status) return 'Policies';
        return 'Policies • Filtered';
    }, [q, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Policies" description="Manage policy contracts" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/policies/create">+ Add Policy</Link>
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
                                    '/policies',
                                    { q: q || undefined, status: status || undefined },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Policy number, type, notes..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
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
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="lapsed">Lapsed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                        <SelectItem value="renewed">Renewed</SelectItem>
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
                                        router.get('/policies', {}, { replace: true });
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
                            No policies found.
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between gap-3 border-b p-4">
                                <div className="text-sm text-muted-foreground">
                                    {resultCount} result(s)
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href="/policies/create">+ New Policy</Link>
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Policy</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Underwriter</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Premium</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies?.data.map((p) => {
                                        const clientName =
                                            p.client?.name ?? p.client?.company_name ?? '-';

                                        return (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">
                                                    {p.policy_number}
                                                </TableCell>
                                                <TableCell>{clientName}</TableCell>
                                                <TableCell>{p.underwriter?.name ?? '-'}</TableCell>
                                                <TableCell className="capitalize">{p.status}</TableCell>
                                                <TableCell>
                                                    {Number(p.premium_amount).toFixed(2)} {p.currency}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateRange(p.start_date, p.end_date)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/policies/${p.id}`}>View</Link>
                                                        </Button>
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/policies/${p.id}/edit`}>Edit</Link>
                                                        </Button>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="destructive" size="sm">Delete</Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogDescription>
                                                                        Delete policy &ldquo;{p.policy_number}&rdquo;?
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button variant="secondary">Cancel</Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() => router.delete(`/policies/${p.id}`)}
                                                                    >
                                                                        Confirm delete
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
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

