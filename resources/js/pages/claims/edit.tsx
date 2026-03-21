import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ClaimForm from '@/components/claims/ClaimForm';
import type { BreadcrumbItem } from '@/types';

type Claim = {
    id: number;
    policy_id: number;
    claim_number: string;
    claimant_name: string;
    loss_date: string;
    reported_at: string;
    claim_amount: number | string;
    currency: string;
    status: 'submitted' | 'assessing' | 'approved' | 'declined' | 'settled';
    notes?: string | null;
};

type Props = {
    claim: Claim;
    policies: Array<{ id: number; policy_number: string }>;
};

export default function ClaimsEdit({ claim, policies }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Claims', href: '/claims' },
        { title: claim.claim_number, href: `/claims/${claim.id}` },
        { title: 'Edit', href: `/claims/${claim.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Claim" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit claim" description="Update claim information" />
                <ClaimForm
                    title="Edit claim"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/claims/${claim.id}`}
                    onCancelHref={`/claims/${claim.id}`}
                    initialValues={{
                        policy_id: claim.policy_id,
                        claim_number: claim.claim_number,
                        claimant_name: claim.claimant_name,
                        loss_date: claim.loss_date,
                        reported_at: claim.reported_at,
                        claim_amount:
                            typeof claim.claim_amount === 'number'
                                ? claim.claim_amount
                                : Number(claim.claim_amount),
                        currency: claim.currency,
                        status: claim.status,
                        notes: claim.notes ?? '',
                    }}
                    policies={policies.map((p) => ({ id: p.id, label: p.policy_number }))}
                />
            </div>
        </AppLayout>
    );
}

