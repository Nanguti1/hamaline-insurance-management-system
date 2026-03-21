import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ClientForm from '@/components/clients/ClientForm';
import type { BreadcrumbItem } from '@/types';

type Client = {
    id: number;
    type: 'individual' | 'corporate';
    name?: string | null;
    company_name?: string | null;
    id_number?: string | null;
    registration_number?: string | null;
    kra_pin?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
};

type Props = {
    client: Client;
};

export default function ClientsEdit({ client }: Props) {
    const displayName =
        client.type === 'individual' ? client.name : client.company_name;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        {
            title: displayName ?? 'Client',
            href: `/clients/${client.id}`,
        },
        { title: 'Edit', href: `/clients/${client.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Client" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Edit client"
                    description="Update the client details"
                />

                <ClientForm
                    title="Edit client"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/clients/${client.id}`}
                    initialValues={{
                        type: client.type,
                        name: client.name ?? '',
                        company_name: client.company_name ?? '',
                        id_number: client.id_number ?? '',
                        registration_number: client.registration_number ?? '',
                        kra_pin: client.kra_pin ?? '',
                        phone: client.phone ?? '',
                        email: client.email ?? '',
                        address: client.address ?? '',
                        notes: client.notes ?? '',
                    }}
                    onCancelHref={`/clients/${client.id}`}
                />
            </div>
        </AppLayout>
    );
}

