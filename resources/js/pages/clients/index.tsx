import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clients',
        href: '/clients',
    },
];

type ClientRow = {
    id: number;
    type: 'individual' | 'corporate';
    name?: string | null;
    company_name?: string | null;
    id_number?: string | null;
    registration_number?: string | null;
    phone?: string | null;
    email?: string | null;
};

type Props = {
    clients?: {
        data: ClientRow[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters?: {
        q?: string | null;
        type?: string | null;
    };
};

export default function ClientsIndex({ clients, filters }: Props) {
    const initialQ = filters?.q ?? '';
    const initialType = (filters?.type ?? '') as 'individual' | 'corporate' | '';

    const [q, setQ] = useState<string>(initialQ);
    const [type, setType] = useState<'individual' | 'corporate' | ''>(initialType);

    const emptyState = !clients || clients.data.length === 0;

    const pageTitle = useMemo(() => {
        if (!q && !type) return 'Clients';
        return `Clients • Filtered`;
    }, [q, type]);

    const doSearch = (e: FormEvent) => {
        e.preventDefault();

        router.get(
            '/clients',
            {
                q: q || undefined,
                type: type || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Clients"
                    description="Manage individual and corporate clients"
                />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/clients/create">+ Add Client</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <h2 className="text-sm font-medium">Search</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            onSubmit={doSearch}
                            className="grid gap-4 md:grid-cols-3"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Name, email, ID..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={type || 'all'}
                                    onValueChange={(value) =>
                                        setType(value === 'all' ? '' : (value as 'individual' | 'corporate'))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All types
                                        </SelectItem>
                                        <SelectItem value="individual">
                                            Individual
                                        </SelectItem>
                                        <SelectItem value="corporate">
                                            Corporate
                                        </SelectItem>
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
                                        setType('');
                                        router.get('/clients', {}, { replace: true });
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
                            No clients found.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between gap-3 border-b p-4">
                                    <div className="text-sm text-muted-foreground">
                                        {clients?.data.length ?? 0} result(s)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href="/clients/create">
                                                + New Client
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>ID / Reg</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients?.data.map((client) => {
                                            const displayName =
                                                client.type === 'individual'
                                                    ? client.name
                                                    : client.company_name;
                                            const identifier =
                                                client.type === 'individual'
                                                    ? client.id_number
                                                    : client.registration_number;

                                            return (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">
                                                        {displayName ?? '-'}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {client.type}
                                                    </TableCell>
                                                    <TableCell>
                                                        {identifier ?? '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {client.phone ?? '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {client.email ?? '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/clients/${client.id}`}
                                                                >
                                                                    View
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/clients/${client.id}/edit`}
                                                                >
                                                                    Edit
                                                                </Link>
                                                            </Button>

                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogDescription>
                                                                            Are you sure you want to
                                                                            delete this client?
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <DialogClose asChild>
                                                                            <Button
                                                                                variant="secondary"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </DialogClose>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() =>
                                                                                router.delete(
                                                                                    `/clients/${client.id}`,
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

                        {clients?.links && clients.links.length > 0 && (
                            <div className="flex items-center justify-center gap-2">
                                {clients.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={`${idx}-${link.label}`}
                                                className="px-2 py-2 text-sm text-muted-foreground"
                                            >
                                                {link.label}
                                            </span>
                                        );
                                    }

                                    return (
                                        <Button
                                            // eslint-disable-next-line react/no-array-index-key
                                            key={`${idx}-${link.label}`}
                                            asChild
                                            variant={
                                                link.active
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            size="sm"
                                        >
                                            <Link href={link.url}>
                                                {link.label}
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

