import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Client = {
    id: number;
    type: 'individual' | 'corporate';
    name?: string | null;
    company_name?: string | null;
    id_number?: string | null;
    registration_number?: string | null;
    kra_pin?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
};

type Props = {
    client: Client;
};

export default function ClientsShow({ client }: Props) {
    const displayName =
        client.type === 'individual' ? client.name : client.company_name;

    const identifier =
        client.type === 'individual'
            ? client.id_number
            : client.registration_number;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: displayName ?? 'Client', href: `/clients/${client.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={displayName ? `Client: ${displayName}` : 'Client'} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Client details"
                    description="Review client information"
                />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">
                                        Type
                                    </TableCell>
                                    <TableCell className="font-medium capitalize">
                                        {client.type}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Name / Company
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {displayName ?? '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        ID / Registration
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {identifier ?? '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        KRA PIN
                                    </TableCell>
                                    <TableCell>{client.kra_pin ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Phone
                                    </TableCell>
                                    <TableCell>{client.phone ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Email
                                    </TableCell>
                                    <TableCell>{client.email ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Address
                                    </TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {client.address ?? '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">
                                        Notes
                                    </TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {client.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>

                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/clients">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/clients/${client.id}/edit`}>
                                Edit client
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

