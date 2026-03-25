import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import WibaRiskNoteForm from '@/components/wiba-risks/WibaRiskNoteForm';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'WIBA Risks', href: '/wiba-risks' }, { title: 'Create', href: '/wiba-risks/create' }];

type Props = {
    clients: Array<{ id: number; name?: string | null; company_name?: string | null; type?: string | null }>;
    underwriters: Array<{ id: number; name?: string | null }>;
};

export default function WibaRiskNotesCreate({ clients, underwriters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create WIBA Risk Note" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Create WIBA risk note" description="Capture corporate WIBA employees and submit to underwriter" />
                <WibaRiskNoteForm
                    title="WIBA risk note"
                    submitLabel="Save risk note (draft)"
                    submitUrl="/wiba-risks"
                    onCancelHref="/wiba-risks"
                    clients={clients}
                    underwriters={underwriters}
                />
            </div>
        </AppLayout>
    );
}

