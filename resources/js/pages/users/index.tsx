import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/users' }];

type UserRow = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
};

type Props = {
    users?: {
        data: UserRow[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters?: { q?: string | null };
};

export default function UsersIndex({ users, filters }: Props) {
    const initialQ = filters?.q ?? '';
    const [q, setQ] = useState<string>(initialQ);
    const emptyState = !users || users.data.length === 0;

    const pageTitle = useMemo(() => (q ? 'Users • Filtered' : 'Users'), [q]);

    const doSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/users', { q: q || undefined }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Users" description="Create accounts, assign roles, and control access" />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/users/create">+ Add user</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <h2 className="text-sm font-medium">Search</h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={doSearch} className="flex flex-wrap items-end gap-3">
                            <div className="grid flex-1 gap-2 min-w-[200px]">
                                <Label htmlFor="q">Name or email</Label>
                                <Input
                                    id="q"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search…"
                                />
                            </div>
                            <Button type="submit" size="sm">
                                Search
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQ('');
                                    router.get('/users', {}, { replace: true });
                                }}
                            >
                                Clear
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        {emptyState ? (
                            <div className="p-6 text-sm text-muted-foreground">No users found.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.data.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.roles[0] ?? '—'}</TableCell>
                                            <TableCell>
                                                {u.is_active ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Inactive</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/users/${u.id}/edit`}>Edit</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
