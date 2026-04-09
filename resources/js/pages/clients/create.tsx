import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ClientForm from '@/components/clients/ClientForm';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clients', href: '/clients' },
    { title: 'New Client', href: '/clients/create' },
];

export default function ClientsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Client" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="New client"
                    description="Create a new individual or corporate client"
                />
                <ClientForm
                    title="Create client"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/clients"
                    onCancelHref="/clients"
                />
            </div>
        </AppLayout>
    );
}
