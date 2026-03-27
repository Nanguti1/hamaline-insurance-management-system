import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import PaymentForm from '@/components/payments/PaymentForm';
import type { BreadcrumbItem } from '@/types';

type Payment = {
    id: number;
    policy_id: number;
    payment_number: string;
    amount: number | string;
    currency: string;
    flow: 'in' | 'out';
    method: string;
    status: 'pending' | 'received' | 'reversed';
    paid_at?: string | null;
    reference?: string | null;
    notes?: string | null;
};

type Props = {
    payment: Payment;
    policies: Array<{ id: number; policy_number: string }>;
};

export default function PaymentsEdit({ payment, policies }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payments', href: '/payments' },
        { title: payment.payment_number, href: `/payments/${payment.id}` },
        { title: 'Edit', href: `/payments/${payment.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Payment" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit payment" description="Update payment details" />
                <PaymentForm
                    title="Edit payment"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/payments/${payment.id}`}
                    onCancelHref={`/payments/${payment.id}`}
                    initialValues={{
                        policy_id: payment.policy_id,
                        payment_number: payment.payment_number,
                        amount:
                            typeof payment.amount === 'number'
                                ? payment.amount
                                : Number(payment.amount),
                        currency: payment.currency,
                        flow: payment.flow,
                        method: payment.method,
                        status: payment.status,
                        paid_at: payment.paid_at ?? '',
                        reference: payment.reference ?? '',
                        notes: payment.notes ?? '',
                    }}
                    policies={policies.map((p) => ({
                        id: p.id,
                        label: p.policy_number,
                    }))}
                />
            </div>
        </AppLayout>
    );
}

