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
    filter_client_type?: string | null;
    filter_policy_type?: string | null;
    filter_status?: string | null;
    active_policies_count: number;
    clients_count: number;
    premium_total: number | string;
    claim_total: number | string;
    generated_at: string;
    notes?: string | null;
    report_data?: any;
};

type Props = { report: Report };

export default function ReportsShow({ report }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports' },
        { title: report.title, href: `/reports/${report.id}` },
    ];

    const reportType = report.report_type ?? 'overview';

    const renderReportBody = () => {
        const data = report.report_data ?? {};

        switch (reportType) {
            case 'policies_by_type': {
                const rows: Array<{ policy_type: string | null; total: number }> = data.rows ?? [];
                return (
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Policies by type</h3>
                            <Table>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell>No data</TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((r, i) => (
                                            <TableRow key={`${r.policy_type ?? 'unknown'}-${i}`}>
                                                <TableCell>{r.policy_type ?? 'Unclassified'}</TableCell>
                                                <TableCell className="text-right font-medium">{r.total}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                );
            }
            case 'active_vs_cancelled_policies': {
                const active = Number(data.active ?? 0);
                const cancelled = Number(data.cancelled ?? 0);
                return (
                    <CardContent className="pt-0">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded border p-3">
                                <div className="text-sm text-muted-foreground">Active</div>
                                <div className="mt-2 text-2xl font-semibold">{active}</div>
                            </div>
                            <div className="rounded border p-3">
                                <div className="text-sm text-muted-foreground">Cancelled</div>
                                <div className="mt-2 text-2xl font-semibold">{cancelled}</div>
                            </div>
                        </div>
                    </CardContent>
                );
            }
            case 'claims_summary': {
                const byStatus: Array<{ status: string; total: number; amount: number }> = data.by_status ?? [];
                return (
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Claims summary</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded border p-3">
                                    <div className="text-sm text-muted-foreground">Total claims</div>
                                    <div className="mt-2 text-2xl font-semibold">{Number(data.total_count ?? 0)}</div>
                                </div>
                                <div className="rounded border p-3">
                                    <div className="text-sm text-muted-foreground">Total claim amount</div>
                                    <div className="mt-2 text-2xl font-semibold">{Number(data.total_amount ?? 0).toFixed(2)}</div>
                                </div>
                            </div>
                            <Table>
                                <TableBody>
                                    {byStatus.length === 0 ? (
                                        <TableRow>
                                            <TableCell>No data</TableCell>
                                        </TableRow>
                                    ) : (
                                        byStatus.map((r, i) => (
                                            <TableRow key={`${r.status}-${i}`}>
                                                <TableCell className="capitalize">{r.status}</TableCell>
                                                <TableCell className="text-right">{r.total}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {Number(r.amount ?? 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                );
            }
            case 'premium_collected': {
                return (
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Premium collected</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded border p-3">
                                    <div className="text-sm text-muted-foreground">Total premium</div>
                                    <div className="mt-2 text-2xl font-semibold">{Number(data.total_amount ?? 0).toFixed(2)}</div>
                                </div>
                                <div className="rounded border p-3">
                                    <div className="text-sm text-muted-foreground">Payments count</div>
                                    <div className="mt-2 text-2xl font-semibold">{Number(data.payment_count ?? 0)}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                );
            }
            case 'corporate_employee_coverage': {
                const rows: Array<{ client_id: number; client_name: string; employee_count: number }> = data.rows ?? [];
                return (
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Corporate employee coverage</h3>
                            <Table>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell>No data</TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((r) => (
                                            <TableRow key={r.client_id}>
                                                <TableCell>{r.client_name}</TableCell>
                                                <TableCell className="text-right font-medium">{r.employee_count}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                );
            }
            case 'underwriter_performance': {
                const rows: Array<any> = data.rows ?? [];
                return (
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Underwriter performance</h3>
                            <Table>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell>No data</TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((r) => (
                                            <TableRow key={r.underwriter_id ?? r.underwriter_name}>
                                                <TableCell>{r.underwriter_name}</TableCell>
                                                <TableCell className="text-right">{r.policies_count}</TableCell>
                                                <TableCell className="text-right">{Number(r.premium_total ?? 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{Number(r.claim_total ?? 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{Number(r.claims_ratio ?? 0).toFixed(2)}%</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                );
            }
            default:
                return (
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Report data</h3>
                            <pre className="max-h-96 overflow-auto rounded border bg-muted p-3 text-xs">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                );
        }
    };

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
                                {reportType === 'overview' && (
                                    <>
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
                                            <TableCell>{Number(report.premium_total).toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-muted-foreground">Claims total</TableCell>
                                            <TableCell>{Number(report.claim_total).toFixed(2)}</TableCell>
                                        </TableRow>
                                    </>
                                )}
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {report.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    {renderReportBody()}
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

