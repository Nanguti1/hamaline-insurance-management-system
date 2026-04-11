import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDateRange } from '@/lib/date';
import type { BreadcrumbItem } from '@/types';

type BenefitAmount = { benefit_type: string; amount: number | string };

type MedicalMember = {
    id: number;
    member_number?: string | null;
    is_principal: boolean;
    member_sequence: number;
    relationship: string;
    name: string;
    date_of_birth: string;
    phone: string;
    id_number?: string | null;
    birth_certificate_number?: string | null;
    benefits?: BenefitAmount[];
};

type Props = {
    riskNote: {
        id: number;
        risk_note_number: string;
        status: string;
        notes?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        premium_amount: number | string;
        currency: string;
        risk_note_content?: string | null;
        client?: { id: number; name?: string | null; company_name?: string | null };
        underwriter?: { id: number; name?: string | null } | null;
        medicalMembers?: MedicalMember[];
        policy?: { id: number; policy_number: string; status: string } | null;
    };
};

export default function MedicalRiskNoteShow({ riskNote }: Props) {
    const perms = (((usePage().props as { auth?: { permissions?: string[] } })?.auth?.permissions ?? []) as string[]) ?? [];
    const can = (permission: string) => perms.includes(permission);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medical Risks', href: '/medical-risks' },
        { title: riskNote.risk_note_number, href: `/medical-risks/${riskNote.id}` },
    ];

    const clientName = riskNote.client?.name ?? riskNote.client?.company_name ?? '-';
    const period = formatDateRange(riskNote.start_date, riskNote.end_date);

    const members = riskNote.medicalMembers ?? [];
    const principal = useMemo(() => members.find((m) => m.is_principal) ?? null, [members]);

    const hasUnassignedMemberNumbers = members.some((m) => !m.member_number);

    const [decisionNotes, setDecisionNotes] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [memberNumbers, setMemberNumbers] = useState<Record<number, string>>({});

    const initialMemberNumbers = useMemo(() => {
        const map: Record<number, string> = {};
        for (const m of members) {
            if (m.member_number) map[m.id] = m.member_number;
        }
        return map;
    }, [members]);

    useEffect(() => {
        setMemberNumbers(initialMemberNumbers);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMemberNumbers]);

    const onClickGenerate = () => router.post(`/medical-risks/${riskNote.id}/generate`);
    const onClickSubmit = () => router.post(`/medical-risks/${riskNote.id}/submit`);
    const onClickApprove = () => router.post(`/medical-risks/${riskNote.id}/approve`, { decision_notes: decisionNotes || null });
    const onClickReject = () => router.post(`/medical-risks/${riskNote.id}/reject`, { decision_notes: decisionNotes || null });
    const onClickCancel = () => router.post(`/medical-risks/${riskNote.id}/cancel`, { reason: cancelReason || null });
    const onClickDownloadPDF = () => window.open(`/medical-risks/${riskNote.id}/download-pdf`, '_blank');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Medical Risk Note: ${riskNote.risk_note_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Medical risk note" description="Underwriting workflow and risk note preview" />

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
                                {riskNote.policy && (
                                    <TableRow>
                                        <TableCell className="text-muted-foreground">Policy</TableCell>
                                        <TableCell>
                                            <Link className="underline" href={`/policies/${riskNote.policy.id}`}>
                                                {riskNote.policy.policy_number}
                                            </Link>{' '}
                                            ({riskNote.policy.status})
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Members</h3>
                            <Table>
                                <TableBody>
                                    {members.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="w-32 text-muted-foreground">
                                                {m.member_sequence === 0 ? 'M' : `M+${m.member_sequence}`}
                                            </TableCell>
                                            <TableCell>
                                                {m.name} ({m.relationship}) {m.member_number ? `- ${m.member_number}` : '(unassigned)'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Risk note content</h3>
                                {can('medical_risks.view') && (
                                    <Button variant="outline" size="sm" onClick={onClickDownloadPDF}>
                                        Download PDF
                                    </Button>
                                )}
                            </div>
                            <Textarea value={riskNote.risk_note_content ?? ''} readOnly rows={10} />
                        </div>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Underwriting actions</h3>

                            {riskNote.status === 'draft' && can('medical_risks.manage') && (
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={onClickGenerate}>Generate Risk Note</Button>
                                    <Button variant="secondary" onClick={onClickSubmit}>
                                        Send to Underwriter
                                    </Button>
                                </div>
                            )}

                            {(riskNote.status === 'draft' || riskNote.status === 'pending') && can('medical_risks.cancel') && (
                                <div className="space-y-3">
                                    <Textarea
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

                            {riskNote.status === 'pending' && can('medical_risks.underwrite') && (
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

                            {riskNote.status !== 'active' && riskNote.status !== 'pending' && can('medical_risks.cancel') && (
                                <div className="text-sm text-muted-foreground">No cancellation actions for this status.</div>
                            )}
                        </div>
                    </CardContent>

                    {riskNote.status === 'active' && can('medical_risks.manage') && hasUnassignedMemberNumbers && (
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium">Assign member numbers</h3>
                                <div className="space-y-2">
                                    {members.map((m) => (
                                        <div key={m.id} className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-end">
                                            <div>
                                                <Label>{m.name}</Label>
                                                <div className="text-xs text-muted-foreground">{m.relationship}</div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Input
                                                    value={memberNumbers[m.id] ?? ''}
                                                    onChange={(e) => setMemberNumbers((prev) => ({ ...prev, [m.id]: e.target.value }))}
                                                    placeholder="e.g. M-0001"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            router.patch(`/medical-risks/${riskNote.id}/assign-member-numbers`, {
                                                members: members.map((m) => ({ id: m.id, member_number: memberNumbers[m.id] ?? '' })),
                                            });
                                        }}
                                    >
                                        Save member numbers
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/medical-risks">Back to list</Link>
                        </Button>
                        {riskNote.status === 'active' && riskNote.policy && (
                            <Button asChild>
                                <Link href={`/policies/${riskNote.policy.id}`}>Open policy</Link>
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

