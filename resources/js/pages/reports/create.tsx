import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ReportForm from '@/components/reports/ReportForm';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
    { title: 'Run report', href: '/reports/create' },
];

export default function ReportsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Run report" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Run report" description="Generate a stored report snapshot" />
                <ReportForm
                    title="Create report snapshot"
                    submitLabel="Run report"
                    method="post"
                    submitUrl="/reports"
                    onCancelHref="/reports"
                />
            </div>
        </AppLayout>
    );
}

