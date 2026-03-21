import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import PolicyForm from '@/components/policies/PolicyForm';
import type { BreadcrumbItem } from '@/types';

type ClientOption = { id: number; name?: string | null; company_name?: string | null };
type UnderwriterOption = { id: number; name?: string | null };
type QuotationOption = { id: number; quotation_number: string };

type Props = {
    clients: ClientOption[];
    underwriters: UnderwriterOption[];
    quotations: QuotationOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Policies', href: '/policies' },
    { title: 'New Policy', href: '/policies/create' },
];

export default function PoliciesCreate({ clients, underwriters, quotations }: Props) {
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

