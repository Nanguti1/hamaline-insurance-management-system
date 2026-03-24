import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import UnderwriterForm from '@/components/underwriters/UnderwriterForm';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Underwriters', href: '/underwriters' },
    { title: 'New Underwriter', href: '/underwriters/create' },
];

export default function UnderwritersCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Underwriter" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="New Underwriter"
                    description="Creates a login user with the underwriter role and links the profile"
                />
                <UnderwriterForm
                    variant="create"
                    title="Create underwriter"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/underwriters"
                    onCancelHref="/underwriters"
                />
            </div>
        </AppLayout>
    );
}

