import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import QuotationForm from '@/components/quotations/QuotationForm';
import type { BreadcrumbItem } from '@/types';

type ClientOption = { id: number; name?: string | null; company_name?: string | null };
type SelectOption = { id: number; label: string };
type UnderwriterOption = { id: number; name?: string | null; insurers?: Array<SelectOption> };

type Props = {
    clients: ClientOption[];
    underwriters: UnderwriterOption[];
    insurers: Array<SelectOption>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quotations', href: '/quotations' },
    { title: 'New Quotation', href: '/quotations/create' },
];

export default function QuotationsCreate({ clients, underwriters, insurers }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Quotation" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="New quotation"
                    description="Create a quotation for a client"
                />
                <QuotationForm
                    title="Create quotation"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/quotations"
                    onCancelHref="/quotations"
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
