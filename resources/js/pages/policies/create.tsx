import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import PolicyForm from '@/components/policies/PolicyForm';
import type { BreadcrumbItem } from '@/types';

type ClientOption = { id: number; name?: string | null; company_name?: string | null };
type SelectOption = { id: number; label: string };
type UnderwriterOption = { id: number; name?: string | null; insurers?: Array<SelectOption> };
type QuotationOption = {
    id: number;
    quotation_number: string;
    client_id: number;
    underwriter_id: number;
    insurer_id: number | null;
    premium_amount: number | string;
    currency: string;
    valid_until: string;
    policy_type?: string | null;
    notes?: string | null;
};

type Props = {
    clients: ClientOption[];
    underwriters: UnderwriterOption[];
    quotations: QuotationOption[];
    insurers: Array<SelectOption>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Policies', href: '/policies' },
    { title: 'New Policy', href: '/policies/create' },
];

export default function PoliciesCreate({ clients, underwriters, quotations, insurers }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Policy" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="New policy" description="Create a policy contract" />
                <PolicyForm
                    title="Create policy"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/policies"
                    onCancelHref="/policies"
                    clients={clients.map((c) => ({
                        id: c.id,
                        label: c.name ?? c.company_name ?? 'Client',
                    }))}
                    underwriters={underwriters.map((u) => ({
                        id: u.id,
                        label: u.name ?? 'Underwriter',
                        insurers: u.insurers,
                    }))}
                    quotations={quotations}
                    insurers={insurers}
                />
            </div>
        </AppLayout>
    );
}
