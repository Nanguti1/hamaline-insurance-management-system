import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import CommissionForm from '@/components/commissions/CommissionForm';
import type { BreadcrumbItem } from '@/types';

type Commission = {
    id: number;
    policy_id: number;
    underwriter_id: number;
    commission_number: string;
    percentage?: number | string | null;
    amount: number | string;
    currency: string;
    status: 'pending' | 'paid' | 'cancelled';
    period_start?: string | null;
    period_end?: string | null;
    paid_at?: string | null;
    notes?: string | null;
};

type Props = {
    commission: Commission;
    policies: Array<{
        id: number;
        policy_number: string;
        premium_amount: number | string;
        currency: string;
        underwriter_id: number;
    }>;
    underwriters: Array<{ id: number; name: string }>;
};

export default function CommissionsEdit({ commission, policies, underwriters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Commissions', href: '/commissions' },
        {
            title: commission.commission_number,
            href: `/commissions/${commission.id}`,
        },
        { title: 'Edit', href: `/commissions/${commission.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Commission" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit commission" description="Update commission details" />
                <CommissionForm
                    title="Edit commission"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/commissions/${commission.id}`}
                    onCancelHref={`/commissions/${commission.id}`}
                    initialValues={{
                        policy_id: commission.policy_id,
                        underwriter_id: commission.underwriter_id,
                        commission_number: commission.commission_number,
                        percentage:
                            commission.percentage === null || commission.percentage === undefined
                                ? 0
                                : typeof commission.percentage === 'number'
                                  ? commission.percentage
                                  : Number(commission.percentage),
                        amount:
                            typeof commission.amount === 'number'
                                ? commission.amount
                                : Number(commission.amount),
                        currency: commission.currency,
                        status: commission.status,
                        period_start: commission.period_start ?? '',
                        period_end: commission.period_end ?? '',
                        paid_at: commission.paid_at ?? '',
                        notes: commission.notes ?? '',
                    }}
                    policies={policies.map((p) => ({
                        id: p.id,
                        label: p.policy_number,
                        premium_amount: p.premium_amount,
                        currency: p.currency,
                        underwriter_id: p.underwriter_id,
                    }))}
                    underwriters={underwriters.map((u) => ({
                        id: u.id,
                        label: u.name,
                    }))}
                />
            </div>
        </AppLayout>
    );
}

