import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import QuotationForm from '@/components/quotations/QuotationForm';
import type { BreadcrumbItem } from '@/types';

type ClientOption = { id: number; name?: string | null; company_name?: string | null };
type SelectOption = { id: number; label: string };
type UnderwriterOption = { id: number; name?: string | null; insurers?: Array<SelectOption> };

type Quotation = {
    id: number;
    client_id: number;
    underwriter_id: number;
    insurer_id: number;
    quotation_number: string;
    status: 'draft' | 'issued' | 'approved' | 'rejected' | 'expired';
    premium_amount: number | string;
    currency: string;
    valid_until: string;
    notes?: string | null;
    policy_type?: string | null;
    payment_plan?: string | null;
    installment_count?: number | null;
    vehicle_class?: string | null;
    vehicle_make_model?: string | null;
    year_of_manufacture?: number | null;
    registration_number?: string | null;
    sum_insured?: number | null;
    quoted_base_premium?: number | null;
    quoted_training_levy?: number | null;
    quoted_phcf?: number | null;
    quoted_stamp_duty?: number | null;
    quoted_total_premium?: number | null;
    interests_insured?: string | null;
    excess_remarks?: string | null;
    prepared_by?: string | null;
    reviewed_by?: string | null;
    quoted_on?: string | null;
};

type Props = {
    quotation: Quotation;
    clients: ClientOption[];
    underwriters: UnderwriterOption[];
    insurers: Array<SelectOption>;
};

export default function QuotationsEdit({ quotation, clients, underwriters, insurers }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quotations', href: '/quotations' },
        {
            title: quotation.quotation_number,
            href: `/quotations/${quotation.id}`,
        },
        { title: 'Edit', href: `/quotations/${quotation.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Quotation" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit quotation" description="Update quotation details" />
                <QuotationForm
                    title="Edit quotation"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/quotations/${quotation.id}`}
                    onCancelHref={`/quotations/${quotation.id}`}
                    initialValues={{
                        client_id: quotation.client_id,
                        underwriter_id: quotation.underwriter_id,
                        insurer_id: quotation.insurer_id ?? 0,
                        quotation_number: quotation.quotation_number,
                        status: quotation.status,
                        premium_amount:
                            typeof quotation.premium_amount === 'number'
                                ? quotation.premium_amount
                                : Number(quotation.premium_amount),
                        currency: quotation.currency,
                        valid_until: quotation.valid_until?.slice(0, 10) ?? quotation.valid_until,
                        notes: quotation.notes ?? '',
                        policy_type: (quotation.policy_type as 'motor' | 'medical' | 'wiba') ?? 'motor',
                        payment_plan: (quotation.payment_plan as 'one_off' | 'installments') ?? 'one_off',
                        installment_count:
                            quotation.payment_plan === 'installments' ? (quotation.installment_count ?? 4) : undefined,
                        vehicle_class: quotation.vehicle_class ?? 'MOTOR PRIVATE',
                        vehicle_make_model: quotation.vehicle_make_model ?? '',
                        year_of_manufacture: quotation.year_of_manufacture ?? undefined,
                        registration_number: quotation.registration_number ?? '',
                        sum_insured: quotation.sum_insured ?? undefined,
                        quoted_base_premium: quotation.quoted_base_premium ?? undefined,
                        quoted_training_levy: quotation.quoted_training_levy ?? undefined,
                        quoted_phcf: quotation.quoted_phcf ?? undefined,
                        quoted_stamp_duty: quotation.quoted_stamp_duty ?? undefined,
                        quoted_total_premium: quotation.quoted_total_premium ?? undefined,
                        interests_insured: quotation.interests_insured ?? '',
                        excess_remarks: quotation.excess_remarks ?? '',
                        prepared_by: quotation.prepared_by ?? '',
                        reviewed_by: quotation.reviewed_by ?? '',
                        quoted_on: quotation.quoted_on?.slice(0, 10) ?? '',
                    }}
                    clients={clients.map((c) => ({
                        id: c.id,
                        label: c.name ?? c.company_name ?? 'Client',
                    }))}
                    underwriters={underwriters.map((u) => ({
                        id: u.id,
                        label: u.name ?? 'Underwriter',
                        insurers: u.insurers,
                    }))}
                    insurers={insurers}
                />
            </div>
        </AppLayout>
    );
}
