import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import UnderwriterForm from '@/components/underwriters/UnderwriterForm';
import type { BreadcrumbItem } from '@/types';

type Underwriter = {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    insurers?: Array<{ id: number; name?: string | null }>;
};

type Insurer = { id: number; name?: string | null };

type Props = {
    underwriter: Underwriter;
    insurers: Insurer[];
};

export default function UnderwritersEdit({ underwriter, insurers }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Underwriters', href: '/underwriters' },
        { title: underwriter.name, href: `/underwriters/${underwriter.id}` },
        { title: 'Edit', href: `/underwriters/${underwriter.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Underwriter" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit underwriter" description="Update profile information" />
                <UnderwriterForm
                    variant="edit"
                    title="Edit underwriter"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/underwriters/${underwriter.id}`}
                    initialValues={{
                        name: underwriter.name ?? '',
                        phone: underwriter.phone ?? '',
                        email: underwriter.email ?? '',
                        address: underwriter.address ?? '',
                        notes: underwriter.notes ?? '',
                        insurer_ids: underwriter.insurers?.map((i) => i.id) ?? [],
                    }}
                    onCancelHref={`/underwriters/${underwriter.id}`}
                    insurers={insurers.map((i) => ({ id: i.id, label: i.name ?? 'Insurer' }))}
                />
            </div>
        </AppLayout>
    );
}

