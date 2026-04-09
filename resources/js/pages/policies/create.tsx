import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ProgressivePolicyForm from '@/components/policies/ProgressivePolicyForm';
import type { BreadcrumbItem } from '@/types';

type Underwriter = { id: number; name: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Policies', href: '/policies' },
    { title: 'New Policy', href: '/policies/create' },
];

type Props = {
    underwriters: Underwriter[];
};

export default function PoliciesCreate({ underwriters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Policy" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="New policy"
                    description="Select a client, choose policy type, then complete only the required fields."
                />
                <ProgressivePolicyForm
                    title="Create Policy"
                    submitLabel="Create Policy"
                    method="post"
                    onCancelHref="/policies"
                    underwriters={underwriters}
                />
            </div>
        </AppLayout>
    );
}
