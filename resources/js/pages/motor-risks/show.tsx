import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDateRange } from '@/lib/date';
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
        client?: { name?: string | null; company_name?: string | null };
        underwriter?: { name?: string | null };
        motorDetails?: {
            insured_name?: string | null;
            registration_number?: string | null;
            make_model?: string | null;
            cover_type?: string | null;
            vehicle_use?: string | null;
            sum_insured?: string | number | null;
        } | null;
        policy?: { id: number; policy_number: string; status: string } | null;
    };
    documents?: Array<{ id: number; name: string; url: string; mime_type?: string | null; size: number }>;
};

const requiredDocs = ['Log book', 'ID copy', 'KRA PIN'] as const;

export default function MotorRiskNoteShow({ riskNote, documents = [] }: Props) {
    const perms = (((usePage().props as { auth?: { permissions?: string[] } })?.auth?.permissions ?? []) as string[]) ?? [];
    const can = (permission: string) => perms.includes(permission);
    const errors = (usePage().props as { errors?: Record<string, string> }).errors ?? {};

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Motor Risks', href: '/motor-risks' },
        { title: riskNote.risk_note_number, href: `/motor-risks/${riskNote.id}` },
    ];

    const [decisionNotes, setDecisionNotes] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [documentType, setDocumentType] = useState<'log_book' | 'id_copy' | 'kra_pin'>('log_book');
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const period = formatDateRange(riskNote.start_date, riskNote.end_date);

    const clientName = riskNote.client?.name ?? riskNote.client?.company_name ?? '-';

    const hasPolicy = Boolean(riskNote.policy);
    const uploadedNames = new Set(documents.map((d) => d.name));

    const onClickGenerate = () => router.post(`/motor-risks/${riskNote.id}/generate`);
    const onClickSubmit = () => router.post(`/motor-risks/${riskNote.id}/submit`);
    const onClickApprove = () =>
        router.post(`/motor-risks/${riskNote.id}/approve`, { decision_notes: decisionNotes || null });
    const onClickReject = () =>
        router.post(`/motor-risks/${riskNote.id}/reject`, { decision_notes: decisionNotes || null });
    const onClickCancel = () => router.post(`/motor-risks/${riskNote.id}/cancel`, { reason: cancelReason || null });

    const coverType = useMemo(() => {
        const ct = riskNote.motorDetails?.cover_type ?? '-';
        return ct;
    }, [riskNote.motorDetails?.cover_type]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Motor Risk Note: ${riskNote.risk_note_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Motor risk note" description="Underwriting workflow for motor insurance" />

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
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Insured</TableCell>
                                    <TableCell>{riskNote.motorDetails?.insured_name ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Vehicle</TableCell>
                                    <TableCell>
                                        {riskNote.motorDetails?.registration_number ?? '-'} ({riskNote.motorDetails?.make_model ?? '-'})
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Cover</TableCell>
                                    <TableCell>{coverType}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Risk note content</h3>
                            <Textarea value={riskNote.risk_note_content ?? ''} readOnly rows={12} />
                        </div>
                    </CardContent>

                    <CardContent className="pt-0">
                        <div className="mb-4 space-y-2">
                            <h3 className="text-sm font-medium">Required documents</h3>
                            <div className="grid gap-2 md:grid-cols-3">
                                {requiredDocs.map((name) => {
                                    const ready = uploadedNames.has(name);
                                    return (
                                        <div key={name} className="rounded border px-3 py-2 text-sm">
                                            <span className={ready ? 'text-emerald-600' : 'text-muted-foreground'}>
                                                {ready ? 'Uploaded: ' : 'Missing: '}
                                            </span>
                                            {name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {can('motor_risks.manage') && (
                            <div className="mb-4 space-y-2 rounded border p-3">
                                <h4 className="text-sm font-medium">Upload motor document</h4>
                                <div className="grid gap-2 md:grid-cols-3">
                                    <div className="grid gap-1">
                                        <Label>Document type</Label>
                                        <Select value={documentType} onValueChange={(v) => setDocumentType(v as 'log_book' | 'id_copy' | 'kra_pin')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="log_book">Log book</SelectItem>
                                                <SelectItem value="id_copy">ID copy</SelectItem>
                                                <SelectItem value="kra_pin">KRA PIN</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1 md:col-span-2">
                                        <Label>File</Label>
                                        <input type="file" onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} className="text-sm" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            if (!documentFile) return;
                                            router.post(
                                                `/motor-risks/${riskNote.id}/documents`,
                                                { document: documentFile, document_type: documentType },
                                                { forceFormData: true, onSuccess: () => setDocumentFile(null) },
                                            );
                                        }}
                                    >
                                        Upload document
                                    </Button>
                                    {errors.documents && <span className="text-sm text-destructive">{errors.documents}</span>}
                                </div>
                                <div className="space-y-2">
                                    {documents.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>
                                    ) : (
                                        documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between rounded border px-3 py-2">
                                                <a className="text-sm underline" href={doc.url} target="_blank" rel="noreferrer">
                                                    {doc.name}
                                                </a>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => router.delete(`/motor-risks/${riskNote.id}/documents/${doc.id}`)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Underwriting actions</h3>

                            {riskNote.status === 'draft' && can('motor_risks.manage') && (
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={onClickGenerate}>Generate Risk Note</Button>
                                    <Button variant="secondary" onClick={onClickSubmit}>
                                        Send to Underwriter
                                    </Button>
                                    {can('motor_risks.cancel') && (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            )}

                            {riskNote.status === 'pending' && can('motor_risks.underwrite') && (
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
                            <Link href="/motor-risks">Back to list</Link>
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

