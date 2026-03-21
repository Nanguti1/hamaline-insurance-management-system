import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: number;
    title: string;
    report_type: string;
    range_start?: string | null;
    range_end?: string | null;
    active_policies_count: number;
    clients_count: number;
    premium_total: number | string;
    claim_total: number | string;
    generated_at: string;
    notes?: string | null;
};

type Props = { report: Report };

export default function ReportsShow({ report }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports' },
        { title: report.title, href: `/reports/${report.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Report: ${report.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Report snapshot" description="Stored metrics at generation time" />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Title</TableCell>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Type</TableCell>
                                    <TableCell>{report.report_type}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Range</TableCell>
                                    <TableCell>
                                        {report.range_start ?? '-'} - {report.range_end ?? '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Generated</TableCell>
                                    <TableCell>{report.generated_at}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Active policies</TableCell>
                                    <TableCell>{report.active_policies_count}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Clients</TableCell>
                                    <TableCell>{report.clients_count}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Premium total</TableCell>
                                    <TableCell>
                                        {Number(report.premium_total).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Claims total</TableCell>
                                    <TableCell>
                                        {Number(report.claim_total).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {report.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/reports">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/reports/${report.id}/edit`}>Edit report</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

