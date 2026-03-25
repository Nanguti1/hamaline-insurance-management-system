import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Props = {
    riskNote: {
        id: number;
        risk_note_number: string;
        status: string;
        premium_amount: number | string;
        currency: string;
        start_date?: string | null;
        end_date?: string | null;
        notes?: string | null;
        risk_note_content?: string | null;
        client?: { id: number; name?: string | null; company_name?: string | null };
        underwriter?: { id: number; name?: string | null } | null;
        policy?: { id: number; policy_number: string; status: string } | null;
        wibaEmployees?: Array<{
            id: number;
            employee_sequence: number;
            name: string;
            payroll_number: string;
            id_number: string;
            date_of_birth: string;
            annual_salary: number | string;
        }>;
    };
};

export default function WibaRiskNoteShow({ riskNote }: Props) {
    const perms = (((usePage().props as { auth?: { permissions?: string[] } })?.auth?.permissions ?? []) as string[]) ?? [];
    const can = (permission: string) => perms.includes(permission);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'WIBA Risks', href: '/wiba-risks' },
        { title: riskNote.risk_note_number, href: `/wiba-risks/${riskNote.id}` },
    ];

    const [decisionNotes, setDecisionNotes] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    const period = riskNote.start_date && riskNote.end_date ? `${riskNote.start_date} - ${riskNote.end_date}` : '-';
    const clientName = riskNote.client?.name ?? riskNote.client?.company_name ?? '-';

    const hasPolicy = Boolean(riskNote.policy);

    const onClickGenerate = () => router.post(`/wiba-risks/${riskNote.id}/generate`);
    const onClickSubmit = () => router.post(`/wiba-risks/${riskNote.id}/submit`);
    const onClickApprove = () => router.post(`/wiba-risks/${riskNote.id}/approve`, { decision_notes: decisionNotes || null });
    const onClickReject = () => router.post(`/wiba-risks/${riskNote.id}/reject`, { decision_notes: decisionNotes || null });
    const onClickCancel = () => router.post(`/wiba-risks/${riskNote.id}/cancel`, { reason: cancelReason || null });

    const employees = riskNote.wibaEmployees ?? [];
    const sortedEmployees = [...employees].sort((a, b) => a.employee_sequence - b.employee_sequence);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`WIBA Risk Note: ${riskNote.risk_note_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="WIBA risk note" description="Underwriting workflow for work injury benefits act" />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Risk Note</TableCell>
                                    <TableCell className="font-medium">{riskNote.risk_note_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Client</TableCell>
                                    <TableCell>{clientName}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Underwriter</TableCell>
                                    <TableCell>{riskNote.underwriter?.name ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{riskNote.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Period</TableCell>
                                    <TableCell>{period}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Premium</TableCell>
                                    <TableCell>
                                        {Number(riskNote.premium_amount).toFixed(2)} {riskNote.currency}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Employees</h3>
                            <Table>
                                <TableBody>
                                    {sortedEmployees.map((e, idx) => (
                                        <TableRow key={e.id}>
                                            <TableCell className="w-32 text-muted-foreground">#{idx + 1}</TableCell>
                                            <TableCell>
                                                {e.name} (Payroll {e.payroll_number})
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Risk note content</h3>
                            <Textarea value={riskNote.risk_note_content ?? ''} readOnly rows={12} />
                        </div>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Underwriting actions</h3>

                            {riskNote.status === 'draft' && can('wiba_risks.manage') && (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={onClickGenerate}>Generate Risk Note</Button>
                                        <Button variant="secondary" onClick={onClickSubmit}>
                                            Send to Underwriter
                                        </Button>
                                    </div>

                                    {can('wiba_risks.cancel') && (
                                        <div className="space-y-2">
                                            <Textarea
                                                className="max-w-md"
                                                placeholder="Cancellation reason (optional)"
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                rows={2}
                                            />
                                            <Button variant="destructive" onClick={onClickCancel}>
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {riskNote.status === 'pending' && can('wiba_risks.underwrite') && (
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Decision notes (optional)"
                                        value={decisionNotes}
                                        onChange={(e) => setDecisionNotes(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={onClickApprove}>Approve</Button>
                                        <Button variant="destructive" onClick={onClickReject}>
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/wiba-risks">Back to list</Link>
                        </Button>
                        {hasPolicy && (
                            <Button asChild>
                                <Link href={`/policies/${riskNote.policy!.id}`}>Open policy</Link>
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

