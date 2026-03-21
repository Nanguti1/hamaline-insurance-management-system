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
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Renewals', href: '/renewals' }];

type RenewalRow = {
    id: number;
    renewal_number: string;
    status: string;
    renewal_date: string;
    new_end_date?: string | null;
    premium_amount: number | string;
    currency: string;
    policy?: { policy_number?: string | null };
};

type Props = {
    renewals?: { data: RenewalRow[]; links?: Array<{ url: string | null; label: string; active: boolean }> };
    filters?: { q?: string | null; status?: string | null };
};

export default function RenewalsIndex({ renewals, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? '');

    const emptyState = !renewals || renewals.data.length === 0;
    const resultCount = renewals?.data.length ?? 0;

    const pageTitle = useMemo(() => {
        if (!q && !status) return 'Renewals';
        return 'Renewals • Filtered';
    }, [q, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Renewals" description="Manage policy renewals" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/renewals/create">+ Add Renewal</Link>
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
                                    '/renewals',
                                    { q: q || undefined, status: status || undefined },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Renewal number, policy, notes..."
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
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
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
                                        router.get('/renewals', {}, { replace: true });
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
                            No renewals found.
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
                                        <Link href="/renewals/create">+ New Renewal</Link>
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Renewal</TableHead>
                                        <TableHead>Policy</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Renewal date</TableHead>
                                        <TableHead>New end</TableHead>
                                        <TableHead>Premium</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renewals?.data.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">{r.renewal_number}</TableCell>
                                            <TableCell>{r.policy?.policy_number ?? '-'}</TableCell>
                                            <TableCell className="capitalize">{r.status}</TableCell>
                                            <TableCell>{r.renewal_date}</TableCell>
                                            <TableCell>{r.new_end_date ?? '-'}</TableCell>
                                            <TableCell>
                                                {Number(r.premium_amount).toFixed(2)} {r.currency}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/renewals/${r.id}`}>View</Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/renewals/${r.id}/edit`}>Edit</Link>
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">Delete</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogDescription>
                                                                    Delete renewal &ldquo;{r.renewal_number}&rdquo;?
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="secondary">Cancel</Button>
                                                                </DialogClose>
                                                                <Button variant="destructive" onClick={() => router.delete(`/renewals/${r.id}`)}>
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

