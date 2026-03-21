import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Policy = { policy_number?: string | null };
type Underwriter = { name?: string | null };

type Commission = {
    id: number;
    commission_number: string;
    policy?: Policy;
    underwriter?: Underwriter;
    percentage?: number | string | null;
    amount: number | string;
    currency: string;
    status: string;
    period_start?: string | null;
    period_end?: string | null;
    paid_at?: string | null;
    notes?: string | null;
};

type Props = { commission: Commission };

export default function CommissionsShow({ commission }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Commissions', href: '/commissions' },
        { title: commission.commission_number, href: `/commissions/${commission.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Commission: ${commission.commission_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Commission details" description="Review commission information" />
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Commission</TableCell>
                                    <TableCell className="font-medium">{commission.commission_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Policy</TableCell>
                                    <TableCell>{commission.policy?.policy_number ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Underwriter</TableCell>
                                    <TableCell>{commission.underwriter?.name ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Percentage</TableCell>
                                    <TableCell>
                                        {commission.percentage === null || commission.percentage === undefined || commission.percentage === 0
                                            ? '-'
                                            : `${Number(commission.percentage).toFixed(2)}%`}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Amount</TableCell>
                                    <TableCell>
                                        {Number(commission.amount).toFixed(2)} {commission.currency}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{commission.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Period</TableCell>
                                    <TableCell>
                                        {commission.period_start ?? '-'} - {commission.period_end ?? '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Paid at</TableCell>
                                    <TableCell>{commission.paid_at ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">{commission.notes ?? '-'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/commissions">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/commissions/${commission.id}/edit`}>Edit commission</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

