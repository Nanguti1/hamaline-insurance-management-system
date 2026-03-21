import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Policy = { policy_number?: string | null };

type Renewal = {
    id: number;
    renewal_number: string;
    status: string;
    renewal_date: string;
    new_end_date?: string | null;
    premium_amount: number | string;
    currency: string;
    notes?: string | null;
    policy?: Policy;
};

type Props = { renewal: Renewal };

export default function RenewalsShow({ renewal }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Renewals', href: '/renewals' },
        { title: renewal.renewal_number, href: `/renewals/${renewal.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Renewal: ${renewal.renewal_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Renewal details" description="Review renewal information" />
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Renewal</TableCell>
                                    <TableCell className="font-medium">{renewal.renewal_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Policy</TableCell>
                                    <TableCell>{renewal.policy?.policy_number ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{renewal.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Renewal date</TableCell>
                                    <TableCell>{renewal.renewal_date}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">New end date</TableCell>
                                    <TableCell>{renewal.new_end_date ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Premium</TableCell>
                                    <TableCell>
                                        {Number(renewal.premium_amount).toFixed(2)} {renewal.currency}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {renewal.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/renewals">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/renewals/${renewal.id}/edit`}>Edit renewal</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

