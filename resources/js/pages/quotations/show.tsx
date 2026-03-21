import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Client = { name?: string | null; company_name?: string | null };
type Underwriter = { name?: string | null };

type Quotation = {
    id: number;
    quotation_number: string;
    status: string;
    premium_amount: number | string;
    currency: string;
    valid_until: string;
    notes?: string | null;
    client?: Client;
    underwriter?: Underwriter;
};

type Props = { quotation: Quotation };

export default function QuotationsShow({ quotation }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quotations', href: '/quotations' },
        { title: quotation.quotation_number, href: `/quotations/${quotation.id}` },
    ];

    const clientName = quotation.client?.name ?? quotation.client?.company_name ?? '-';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Quotation: ${quotation.quotation_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Quotation details" description="Review quote information" />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Quotation</TableCell>
                                    <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Client</TableCell>
                                    <TableCell>{clientName}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Underwriter</TableCell>
                                    <TableCell>{quotation.underwriter?.name ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{quotation.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Premium</TableCell>
                                    <TableCell>
                                        {Number(quotation.premium_amount).toFixed(2)} {quotation.currency}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Valid until</TableCell>
                                    <TableCell>{quotation.valid_until}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {quotation.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/quotations">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/quotations/${quotation.id}/edit`}>Edit quotation</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

