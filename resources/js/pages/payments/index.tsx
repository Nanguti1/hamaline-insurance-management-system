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
import { formatDate } from '@/lib/date';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payments', href: '/payments' }];

type PaymentRow = {
    id: number;
    flow: 'in' | 'out';
    payment_number: string;
    amount: number | string;
    currency: string;
    method: string;
    status: string;
    paid_at?: string | null;
    policy?: { policy_number?: string | null };
};

type Props = {
    payments?: { data: PaymentRow[]; links?: Array<{ url: string | null; label: string; active: boolean }> };
    filters?: { q?: string | null; status?: string | null };
};

export default function PaymentsIndex({ payments, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? '');

    const emptyState = !payments || payments.data.length === 0;
    const resultCount = payments?.data.length ?? 0;

    const pageTitle = useMemo(() => {
        if (!q && !status) return 'Payments';
        return 'Payments • Filtered';
    }, [q, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Payments" description="Track premium payments" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/payments/create">+ Add Payment</Link>
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
                                    '/payments',
                                    { q: q || undefined, status: status || undefined },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Payment number, ref, notes..."
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
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="received">Received</SelectItem>
                                        <SelectItem value="reversed">Reversed</SelectItem>
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
                                        router.get('/payments', {}, { replace: true });
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
                            No payments found.
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
                                        <Link href="/payments/create">+ New Payment</Link>
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Policy</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Paid at</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments?.data.map((pay) => (
                                        <TableRow key={pay.id}>
                                            <TableCell className="font-medium">{pay.payment_number}</TableCell>
                                            <TableCell>{pay.policy?.policy_number ?? '-'}</TableCell>
                                            <TableCell>
                                                {Number(pay.amount).toFixed(2)} {pay.currency}
                                            </TableCell>
                                            <TableCell>{pay.method}</TableCell>
                                            <TableCell>{pay.flow === 'in' ? 'In' : 'Out'}</TableCell>
                                            <TableCell className="capitalize">{pay.status}</TableCell>
                                            <TableCell>{formatDate(pay.paid_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/payments/${pay.id}`}>View</Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/payments/${pay.id}/edit`}>Edit</Link>
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">Delete</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogDescription>
                                                                    Delete payment &ldquo;{pay.payment_number}&rdquo;?
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="secondary">Cancel</Button>
                                                                </DialogClose>
                                                                <Button variant="destructive" onClick={() => router.delete(`/payments/${pay.id}`)}>
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

