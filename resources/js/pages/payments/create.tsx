import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import PaymentForm from '@/components/payments/PaymentForm';
import type { BreadcrumbItem } from '@/types';

type Props = {
    policies: Array<{ id: number; policy_number: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payments', href: '/payments' },
    { title: 'New Payment', href: '/payments/create' },
];

export default function PaymentsCreate({ policies }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Payment" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="New payment" description="Record money received (in) or paid out (out)" />
                <PaymentForm
                    title="Create payment"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/payments"
                    onCancelHref="/payments"
                    policies={policies.map((p) => ({
                        id: p.id,
                        label: p.policy_number,
                    }))}
                />
            </div>
        </AppLayout>
    );
}

