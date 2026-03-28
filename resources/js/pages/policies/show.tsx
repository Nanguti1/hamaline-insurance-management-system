import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDateRange } from '@/lib/date';
import type { BreadcrumbItem } from '@/types';

type Client = { name?: string | null; company_name?: string | null };
type Underwriter = { name?: string | null };
type Quotation = { quotation_number?: string | null };

type Policy = {
    id: number;
    policy_number: string;
    policy_type?: string | null;
    status: string;
    start_date: string;
    end_date: string;
    premium_amount: number | string;
    currency: string;
    notes?: string | null;
    risk_note_content?: string | null;
    client?: Client;
    underwriter?: Underwriter;
    quotation?: Quotation | null;
};

type LinkedRiskNote = {
    id: number;
    line_type: string;
    risk_note_number: string;
};

function riskNoteHref(rn: LinkedRiskNote): string {
    if (rn.line_type === 'medical') {
        return `/medical-risks/${rn.id}`;
    }
    if (rn.line_type === 'wiba') {
        return `/wiba-risks/${rn.id}`;
    }
    return `/motor-risks/${rn.id}`;
}

type DocumentItem = {
    id: number;
    name: string;
    url: string;
    mime_type?: string | null;
    size: number;
};

type Props = {
    policy: Policy;
    documents?: DocumentItem[];
    linkedRiskNote?: LinkedRiskNote | null;
};

export default function PoliciesShow({ policy, documents = [], linkedRiskNote = null }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canManage = ((usePage().props as { auth?: { permissions?: string[] } }).auth?.permissions ?? []).includes('policies.manage');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Policies', href: '/policies' },
        { title: policy.policy_number, href: `/policies/${policy.id}` },
    ];

    const clientName = policy.client?.name ?? policy.client?.company_name ?? '-';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Policy: ${policy.policy_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Policy details" description="Review policy information" />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Policy</TableCell>
                                    <TableCell className="font-medium">{policy.policy_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Client</TableCell>
                                    <TableCell>{clientName}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Underwriter</TableCell>
                                    <TableCell>{policy.underwriter?.name ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Quotation</TableCell>
                                    <TableCell>{policy.quotation?.quotation_number ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Type</TableCell>
                                    <TableCell>{policy.policy_type ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{policy.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Period</TableCell>
                                    <TableCell>{formatDateRange(policy.start_date, policy.end_date)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Premium</TableCell>
                                    <TableCell>
                                        {Number(policy.premium_amount).toFixed(2)} {policy.currency}
                                    </TableCell>
                                </TableRow>
                                {linkedRiskNote && (
                                    <TableRow>
                                        <TableCell className="text-muted-foreground">Risk note</TableCell>
                                        <TableCell>
                                            <Button variant="link" className="h-auto p-0" asChild>
                                                <Link href={riskNoteHref(linkedRiskNote)}>
                                                    {linkedRiskNote.risk_note_number}
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell className="align-top text-muted-foreground">
                                        Risk note details
                                    </TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {policy.risk_note_content?.trim()
                                            ? policy.risk_note_content
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">
                                        {policy.notes ?? '-'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Policy documents</h3>
                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files ?? []);
                                            if (files.length === 0) return;

                                            const form = new FormData();
                                            files.forEach((file) => form.append('documents[]', file));

                                            router.post(`/policies/${policy.id}/documents`, form, {
                                                onSuccess: () => {
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                },
                                            });
                                        }}
                                        className="hidden"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Upload document
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-2">
                                {documents.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between rounded border px-3 py-2">
                                            <a className="text-sm underline" href={doc.url} target="_blank" rel="noreferrer">
                                                {doc.name}
                                            </a>
                                            {canManage && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => router.delete(`/policies/${policy.id}/documents/${doc.id}`)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="secondary" asChild>
                            <Link href="/policies">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/policies/${policy.id}/edit`}>Edit policy</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

