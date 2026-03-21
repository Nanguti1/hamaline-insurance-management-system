import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ClaimForm from '@/components/claims/ClaimForm';
import type { BreadcrumbItem } from '@/types';

type Props = {
    policies: Array<{ id: number; policy_number: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Claims', href: '/claims' },
    { title: 'New Claim', href: '/claims/create' },
];

export default function ClaimsCreate({ policies }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Claim" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="New claim" description="Create a new insurance claim" />
                <ClaimForm
                    title="Create claim"
                    submitLabel="Create"
                    method="post"
                    submitUrl="/claims"
                    onCancelHref="/claims"
                    policies={policies.map((p) => ({
                        id: p.id,
                        label: p.policy_number,
                    }))}
                />
            </div>
        </AppLayout>
    );
}

