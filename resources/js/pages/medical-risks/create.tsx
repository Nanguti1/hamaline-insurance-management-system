import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import MedicalRiskNoteForm from '@/components/medical-risks/MedicalRiskNoteForm';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Medical Risks', href: '/medical-risks' },
    { title: 'Create', href: '/medical-risks/create' },
];

type Props = {
    clients: Array<{ id: number; name?: string | null; company_name?: string | null }>;
    underwriters: Array<{ id: number; name?: string | null }>;
};

export default function MedicalRiskNotesCreate({ clients, underwriters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Medical Risk Note" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Create medical risk note" description="Capture client, members, benefits and generate risk note" />
                <MedicalRiskNoteForm
                    title="Medical risk note"
                    submitLabel="Save risk note (draft)"
                    submitUrl="/medical-risks"
                    onCancelHref="/medical-risks"
                    clients={clients}
                    underwriters={underwriters}
                />
            </div>
        </AppLayout>
    );
}

