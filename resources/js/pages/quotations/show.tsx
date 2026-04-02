import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Client = { name?: string | null; company_name?: string | null };
type Underwriter = { name?: string | null };
type Insurer = { name?: string | null };

type Quotation = {
    id: number;
    quotation_number: string;
    status: string;
    premium_amount: number | string;
    currency: string;
    valid_until: string;
    notes?: string | null;
    policy_type?: string | null;
    payment_plan?: string | null;
    installment_count?: number | null;
    client?: Client;
    underwriter?: Underwriter;
    insurer?: Insurer;
};

type Props = { quotation: Quotation };

export default function QuotationsShow({ quotation }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quotations', href: '/quotations' },
        { title: quotation.quotation_number, href: `/quotations/${quotation.id}` },
    ];

    const clientName = quotation.client?.name ?? quotation.client?.company_name ?? '-';
    const premium = Number(quotation.premium_amount);
    const plan = quotation.payment_plan ?? 'one_off';
    const count = quotation.installment_count ?? 0;
    const perInstallment =
        plan === 'installments' && count > 0 ? premium / count : premium;

    const installmentRows =
        plan === 'installments' && count > 0
            ? Array.from({ length: count }, (_, i) => ({
                  n: i + 1,
                  amount: perInstallment,
              }))
            : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Quotation: ${quotation.quotation_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 print:p-2">
                <div className="print:hidden">
                    <Heading title="Quotation details" description="Review quote information" />
                </div>
                <div className="hidden print:block print:text-center print:mb-4">
                    <h1 className="text-xl font-semibold">Quotation {quotation.quotation_number}</h1>
                    <p className="text-sm text-muted-foreground">{clientName}</p>
                </div>

                <Card className="print:border-0 print:shadow-none">
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
                                    <TableCell className="text-muted-foreground">Company (insurer)</TableCell>
                                    <TableCell>{quotation.insurer?.name ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Policy type</TableCell>
                                    <TableCell className="capitalize">
                                        {quotation.policy_type ? quotation.policy_type.replace(/_/g, ' ') : '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{quotation.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Premium (total)</TableCell>
                                    <TableCell>
                                        {premium.toFixed(2)} {quotation.currency}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Payment</TableCell>
                                    <TableCell>
                                        {plan === 'installments' && count > 0 ? (
                                            <>
                                                {count} equal installments of {perInstallment.toFixed(2)}{' '}
                                                {quotation.currency} each (same amount per installment).
                                            </>
                                        ) : (
                                            <>One-off payment of {premium.toFixed(2)} {quotation.currency}.</>
                                        )}
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

                        {installmentRows.length > 0 && (
                            <div className="mt-6 space-y-2 print:break-inside-avoid">
                                <h3 className="text-sm font-medium">Installment schedule (print)</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Installment</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {installmentRows.map((row) => (
                                            <TableRow key={row.n}>
                                                <TableCell>{row.n}</TableCell>
                                                <TableCell className="text-right">
                                                    {row.amount.toFixed(2)} {quotation.currency}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end gap-2 print:hidden">
                        <Button variant="secondary" asChild>
                            <Link href="/quotations">Back to list</Link>
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.print()}>
                            Print
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
