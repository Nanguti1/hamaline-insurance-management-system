import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import PolicyForm from '@/components/policies/PolicyForm';
import type { BreadcrumbItem } from '@/types';

type ClientOption = { id: number; name?: string | null; company_name?: string | null };
type UnderwriterOption = { id: number; name?: string | null };
type QuotationOption = { id: number; quotation_number: string };

type Policy = {
    id: number;
    client_id: number;
    underwriter_id: number;
    quotation_id?: number | null;
    policy_number: string;
    policy_type?: string | null;
    status: 'active' | 'lapsed' | 'cancelled' | 'expired' | 'renewed';
    start_date: string;
    end_date: string;
    premium_amount: number | string;
    currency: string;
    notes?: string | null;
};

type Props = {
    policy: Policy;
    clients: ClientOption[];
    underwriters: UnderwriterOption[];
    quotations: QuotationOption[];
};

export default function PoliciesEdit({ policy, clients, underwriters, quotations }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Policies', href: '/policies' },
        { title: policy.policy_number, href: `/policies/${policy.id}` },
        { title: 'Edit', href: `/policies/${policy.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Policy" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit policy" description="Update policy details" />
                <PolicyForm
                    title="Edit policy"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/policies/${policy.id}`}
                    onCancelHref={`/policies/${policy.id}`}
                    initialValues={{
                        client_id: policy.client_id,
                        underwriter_id: policy.underwriter_id,
                        quotation_id: policy.quotation_id ?? 0,
                        policy_number: policy.policy_number,
                        policy_type: policy.policy_type ?? '',
                        status: policy.status,
                        start_date: policy.start_date,
                        end_date: policy.end_date,
                        premium_amount:
                            typeof policy.premium_amount === 'number'
                                ? policy.premium_amount
                                : Number(policy.premium_amount),
                        currency: policy.currency,
                        notes: policy.notes ?? '',
                    }}
                    clients={clients.map((c) => ({
                        id: c.id,
                        label: c.name ?? c.company_name ?? 'Client',
                    }))}
                    underwriters={underwriters.map((u) => ({
                        id: u.id,
                        label: u.name ?? 'Underwriter',
                    }))}
                    quotations={quotations.map((q) => ({
                        id: q.id,
                        label: q.quotation_number,
                    }))}
                />
            </div>
        </AppLayout>
    );
}

