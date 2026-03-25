import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import ReportForm from '@/components/reports/ReportForm';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: number;
    title: string;
    report_type?: string;
    range_start?: string | null;
    range_end?: string | null;
    filter_client_type?: string | null;
    filter_policy_type?: string | null;
    filter_status?: string | null;
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
                        report_type: (report.report_type as any) ?? 'overview',
                        range_start: report.range_start ?? '',
                        range_end: report.range_end ?? '',
                        client_type: report.filter_client_type ?? '',
                        policy_type: report.filter_policy_type ?? '',
                        status: report.filter_status ?? '',
                        notes: report.notes ?? '',
                    }}
                />
            </div>
        </AppLayout>
    );
}

