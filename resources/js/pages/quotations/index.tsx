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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quotations', href: '/quotations' },
];

type QuotationRow = {
    id: number;
    quotation_number: string;
    status: string;
    premium_amount: number | string;
    currency: string;
    valid_until: string;
    client?: { name?: string | null; company_name?: string | null };
    insurer?: { name?: string | null };
};

type Props = {
    quotations?: {
        data: QuotationRow[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters?: {
        q?: string | null;
        status?: string | null;
    };
};

export default function QuotationsIndex({ quotations, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? '');

    const emptyState = !quotations || quotations.data.length === 0;

    const pageTitle = useMemo(() => {
        if (!q && !status) return 'Quotations';
        return 'Quotations • Filtered';
    }, [q, status]);

    const resultCount = quotations?.data.length ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Quotations" description="Quotes issued to clients" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/quotations/create">+ Add Quotation</Link>
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
                                    '/quotations',
                                    {
                                        q: q || undefined,
                                        status: status || undefined,
                                    },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Quotation number / notes..."
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
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="issued">Issued</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
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
                                        router.get('/quotations', {}, { replace: true });
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
                            No quotations found.
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
                                        <Link href="/quotations/create">+ New Quotation</Link>
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quotation</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Premium</TableHead>
                                        <TableHead>Valid until</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotations?.data.map((qt) => {
                                        const clientName =
                                            qt.client?.name ?? qt.client?.company_name ?? '-';

                                        return (
                                            <TableRow key={qt.id}>
                                                <TableCell className="font-medium">
                                                    {qt.quotation_number}
                                                </TableCell>
                                                <TableCell>{clientName}</TableCell>
                                                <TableCell>{qt.insurer?.name ?? '-'}</TableCell>
                                                <TableCell className="capitalize">
                                                    {qt.status}
                                                </TableCell>
                                                <TableCell>
                                                    {Number(qt.premium_amount).toFixed(2)} {qt.currency}
                                                </TableCell>
                                                <TableCell>{qt.valid_until}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/quotations/${qt.id}`}>View</Link>
                                                        </Button>
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/quotations/${qt.id}/edit`}>Edit</Link>
                                                        </Button>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="destructive" size="sm">Delete</Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogDescription>
                                                                        Delete quotation &ldquo;{qt.quotation_number}&rdquo;?
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button variant="secondary">
                                                                            Cancel
                                                                        </Button>
                                                                    </DialogClose>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            deleteResource(
                                                                                `/quotations/${qt.id}`,
                                                                                'Quotation deleted successfully.',
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

