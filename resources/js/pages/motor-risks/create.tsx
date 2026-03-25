import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import MotorRiskNoteForm from '@/components/motor-risks/MotorRiskNoteForm';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Motor Risks', href: '/motor-risks' }, { title: 'Create', href: '/motor-risks/create' }];

type Props = {
    clients: Array<{ id: number; name?: string | null; company_name?: string | null }>;
    underwriters: Array<{ id: number; name?: string | null }>;
};

export default function MotorRiskNotesCreate({ clients, underwriters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Motor Risk Note" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Create motor risk note" description="Capture insured, vehicle, cover and financials" />
                <MotorRiskNoteForm
                    title="Motor risk note"
                    submitLabel="Save risk note (draft)"
                    submitUrl="/motor-risks"
                    onCancelHref="/motor-risks"
                    clients={clients}
                    underwriters={underwriters}
                />
            </div>
        </AppLayout>
    );
}

