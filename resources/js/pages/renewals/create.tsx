import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import RenewalForm from '@/components/renewals/RenewalForm';
import type { BreadcrumbItem } from '@/types';

type Props = { policies: Array<{ id: number; policy_number: string }> };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Renewals', href: '/renewals' },
    { title: 'New Renewal', href: '/renewals/create' },
];

export default function RenewalsCreate({ policies }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Renewal" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="New renewal" description="Create a renewal entry" />
                <RenewalForm
                    title="Create renewal"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/renewals"
                    onCancelHref="/renewals"
                    policies={policies.map((p) => ({ id: p.id, label: p.policy_number }))}
                />
            </div>
        </AppLayout>
    );
}

