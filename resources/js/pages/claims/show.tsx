import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';

type Policy = { policy_number?: string | null };

type Claim = {
    id: number;
    claim_number: string;
    claimant_name: string;
    loss_date: string;
    reported_at: string;
    claim_amount: number | string;
    currency: string;
    status: string;
    notes?: string | null;
    policy?: Policy;
};

type DocumentItem = {
    id: number;
    name: string;
    url: string;
    mime_type?: string | null;
    size: number;
};

type Props = {
    claim: Claim;
    documents?: DocumentItem[];
};

export default function ClaimsShow({ claim, documents = [] }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const canManage = ((usePage().props as { auth?: { permissions?: string[] } }).auth?.permissions ?? []).includes('claims.manage');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Claims', href: '/claims' },
        { title: claim.claim_number, href: `/claims/${claim.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Claim: ${claim.claim_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Claim details" description="Review claim information" />

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-48 text-muted-foreground">Claim</TableCell>
                                    <TableCell className="font-medium">{claim.claim_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Policy</TableCell>
                                    <TableCell>{claim.policy?.policy_number ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Claimant</TableCell>
                                    <TableCell>{claim.claimant_name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Loss date</TableCell>
                                    <TableCell>{claim.loss_date}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Reported at</TableCell>
                                    <TableCell>{claim.reported_at}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Amount</TableCell>
                                    <TableCell>
                                        {Number(claim.claim_amount).toFixed(2)} {claim.currency}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Status</TableCell>
                                    <TableCell className="capitalize">{claim.status}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-muted-foreground">Notes</TableCell>
                                    <TableCell className="whitespace-pre-line">{claim.notes ?? '-'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Claim documents</h3>
                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            if (!file) return;
                                            router.post(
                                                `/claims/${claim.id}/documents`,
                                                { document: file },
                                                {
                                                    forceFormData: true,
                                                    onSuccess: () => setFile(null),
                                                },
                                            );
                                        }}
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
                                                    onClick={() => router.delete(`/claims/${claim.id}/documents/${doc.id}`)}
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
                            <Link href="/claims">Back to list</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/claims/${claim.id}/edit`}>Edit claim</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}

