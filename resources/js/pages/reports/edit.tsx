import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ReportForm from '@/components/reports/ReportForm';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: number;
    title: string;
    range_start?: string | null;
    range_end?: string | null;
    notes?: string | null;
};

type Props = { report: Report };

export default function ReportsEdit({ report }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports' },
        { title: report.title, href: `/reports/${report.id}` },
        { title: 'Edit', href: `/reports/${report.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit report" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit report" description="Update report filters and snapshot" />
                <ReportForm
                    title="Edit report snapshot"
                    submitLabel="Save changes"
                    method="put"
                    submitUrl={`/reports/${report.id}`}
                    onCancelHref={`/reports/${report.id}`}
                    initialValues={{
                        title: report.title,
                        range_start: report.range_start ?? '',
                        range_end: report.range_end ?? '',
                        notes: report.notes ?? '',
                    }}
                />
            </div>
        </AppLayout>
    );
}

