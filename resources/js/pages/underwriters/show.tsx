import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Underwriter = {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
};

type Props = {
    underwriter: Underwriter;
};

export default function UnderwritersShow({ underwriter }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Underwriters', href: '/underwriters' },
        { title: underwriter.name, href: `/underwriters/${underwriter.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Underwriter: ${underwriter.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Underwriter details" description="Profile information" />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">
                                        Name
                                    </TableCell>
                                    <TableCell className="font-medium">{underwriter.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Phone</TableCell>
                                    <TableCell>{underwriter.phone ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Email</TableCell>
                                    <TableCell>{underwriter.email ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Address</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {underwriter.address ?? '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {underwriter.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/underwriters">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/underwriters/${underwriter.id}/edit`}>Edit</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

