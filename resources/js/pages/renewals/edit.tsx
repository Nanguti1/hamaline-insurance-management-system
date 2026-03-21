import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import RenewalForm from '@/components/renewals/RenewalForm';
import type { BreadcrumbItem } from '@/types';

type Renewal = {
    id: number;
    policy_id: number;
    renewal_number: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    renewal_date: string;
    new_end_date?: string | null;
    premium_amount: number | string;
    currency: string;
    notes?: string | null;
};

type Props = {
    renewal: Renewal;
    policies: Array<{ id: number; policy_number: string }>;
};

export default function RenewalsEdit({ renewal, policies }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Renewals', href: '/renewals' },
        { title: renewal.renewal_number, href: `/renewals/${renewal.id}` },
        { title: 'Edit', href: `/renewals/${renewal.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Renewal" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit renewal" description="Update renewal information" />
                <RenewalForm
                    title="Edit renewal"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/renewals/${renewal.id}`}
                    onCancelHref={`/renewals/${renewal.id}`}
                    initialValues={{
                        policy_id: renewal.policy_id,
                        renewal_number: renewal.renewal_number,
                        status: renewal.status,
                        renewal_date: renewal.renewal_date,
                        new_end_date: renewal.new_end_date ?? '',
                        premium_amount:
                            typeof renewal.premium_amount === 'number'
                                ? renewal.premium_amount
                                : Number(renewal.premium_amount),
                        currency: renewal.currency,
                        notes: renewal.notes ?? '',
                    }}
                    policies={policies.map((p) => ({ id: p.id, label: p.policy_number }))}
                />
            </div>
        </AppLayout>
    );
}

