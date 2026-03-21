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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Claims', href: '/claims' }];

type ClaimRow = {
    id: number;
    claim_number: string;
    claimant_name: string;
    claim_amount: number | string;
    currency: string;
    status: string;
    loss_date: string;
    reported_at: string;
    policy?: { policy_number?: string | null };
};

type Props = {
    claims?: { data: ClaimRow[]; links?: Array<{ url: string | null; label: string; active: boolean }> };
    filters?: { q?: string | null; status?: string | null };
};

export default function ClaimsIndex({ claims, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? '');

    const emptyState = !claims || claims.data.length === 0;
    const resultCount = claims?.data.length ?? 0;

    const pageTitle = useMemo(() => {
        if (!q && !status) return 'Claims';
        return 'Claims • Filtered';
    }, [q, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Claims" description="Track insurance claims" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/claims/create">+ Add Claim</Link>
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
                                    '/claims',
                                    { q: q || undefined, status: status || undefined },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Claim number, claimant, notes..."
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
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="assessing">Assessing</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="declined">Declined</SelectItem>
                                        <SelectItem value="settled">Settled</SelectItem>
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
                                        router.get('/claims', {}, { replace: true });
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
                            No claims found.
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
                                        <Link href="/claims/create">+ New Claim</Link>
                                    </Button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Claim</TableHead>
                                        <TableHead>Policy</TableHead>
                                        <TableHead>Claimant</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Loss date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {claims?.data.map((cl) => (
                                        <TableRow key={cl.id}>
                                            <TableCell className="font-medium">{cl.claim_number}</TableCell>
                                            <TableCell>{cl.policy?.policy_number ?? '-'}</TableCell>
                                            <TableCell>{cl.claimant_name}</TableCell>
                                            <TableCell>
                                                {Number(cl.claim_amount).toFixed(2)} {cl.currency}
                                            </TableCell>
                                            <TableCell className="capitalize">{cl.status}</TableCell>
                                            <TableCell>{cl.loss_date}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/claims/${cl.id}`}>View</Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/claims/${cl.id}/edit`}>Edit</Link>
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">Delete</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogDescription>
                                                                    Delete claim &ldquo;{cl.claim_number}&rdquo;?
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="secondary">Cancel</Button>
                                                                </DialogClose>
                                                                <Button variant="destructive" onClick={() => router.delete(`/claims/${cl.id}`)}>
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

