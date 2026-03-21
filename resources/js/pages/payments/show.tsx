import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Policy = { policy_number?: string | null };

type Payment = {
    id: number;
    payment_number: string;
    amount: number | string;
    currency: string;
    method: string;
    status: string;
    paid_at?: string | null;
    reference?: string | null;
    notes?: string | null;
    policy?: Policy;
};

type Props = { payment: Payment };

export default function PaymentsShow({ payment }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payments', href: '/payments' },
        { title: payment.payment_number, href: `/payments/${payment.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment: ${payment.payment_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Payment details" description="Review payment information" />
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Payment</TableCell>
                                    <TableCell className="font-medium">{payment.payment_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Policy</TableCell>
                                    <TableCell>{payment.policy?.policy_number ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Amount</TableCell>
                                    <TableCell>
                                        {Number(payment.amount).toFixed(2)} {payment.currency}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Method</TableCell>
                                    <TableCell>{payment.method}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{payment.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Paid at</TableCell>
                                    <TableCell>{payment.paid_at ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Reference</TableCell>
                                    <TableCell>{payment.reference ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {payment.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/payments">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/payments/${payment.id}/edit`}>Edit payment</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

