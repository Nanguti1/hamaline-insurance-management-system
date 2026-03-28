import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import CommissionForm from '@/components/commissions/CommissionForm';
import type { BreadcrumbItem } from '@/types';

type Props = {
    policies: Array<{
        id: number;
        policy_number: string;
        premium_amount: number | string;
        currency: string;
        underwriter_id: number;
    }>;
    underwriters: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Commissions', href: '/commissions' },
    { title: 'New Commission', href: '/commissions/create' },
];

export default function CommissionsCreate({ policies, underwriters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Commission" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="New commission" description="Record a commission entry" />
                <CommissionForm
                    title="Create commission"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/commissions"
                    onCancelHref="/commissions"
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

