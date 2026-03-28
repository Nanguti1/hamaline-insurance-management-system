import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const reportTypeOptions = [
    'overview',
    'policies_by_type',
    'active_vs_cancelled_policies',
    'claims_summary',
    'premium_collected',
    'corporate_employee_coverage',
    'underwriter_performance',
] as const;

type ReportType = (typeof reportTypeOptions)[number];

export const reportSchema = z.object({
    report_type: z.enum(reportTypeOptions),
    title: z.string().trim().min(1).max(255),
    range_start: z.string().trim().optional().or(z.literal('')),
    range_end: z.string().trim().optional().or(z.literal('')),
    client_type: z.enum(['individual', 'corporate']).optional().or(z.literal('')),
    policy_type: z.enum(['medical', 'motor', 'wiba']).optional().or(z.literal('')),
    status: z
        .enum(['pending', 'active', 'cancelled', 'lapsed', 'expired', 'renewed'])
        .optional()
        .or(z.literal('')),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<ReportFormValues> & {
        range_start?: string | null;
        range_end?: string | null;
        client_type?: string | null;
        policy_type?: string | null;
        status?: string | null;
        notes?: string | null;
    };
};

export default function ReportForm({
    title,
    submitLabel,
    method,
    submitUrl,
    onCancelHref,
    initialValues,
}: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            report_type: (initialValues?.report_type as ReportType) ?? 'overview',
            title: initialValues?.title ?? 'Overview report',
            range_start: initialValues?.range_start ?? '',
            range_end: initialValues?.range_end ?? '',
            client_type: (initialValues?.client_type as ReportFormValues['client_type']) ?? '',
            policy_type: (initialValues?.policy_type as ReportFormValues['policy_type']) ?? '',
            status: (initialValues?.status as ReportFormValues['status']) ?? '',
            notes: initialValues?.notes ?? '',
        },
    });

    const submit = (values: ReportFormValues) => {
        const payload = {
            ...values,
            range_start: values.range_start ? values.range_start : null,
            range_end: values.range_end ? values.range_end : null,
            client_type: values.client_type ? values.client_type : null,
            policy_type: values.policy_type ? values.policy_type : null,
            status: values.status ? values.status : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof ReportFormValues, { message: String(message) });
            });
        };

        if (method === 'post') {
            router.post(submitUrl, payload, { preserveScroll: true, onError });
            return;
        }

        router.put(submitUrl, payload, { preserveScroll: true, onError });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" {...register('title')} />
                        <InputError message={errors.title?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="report_type">Report type</Label>
                            <select
                                id="report_type"
                                className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-sm"
                                {...register('report_type')}
                            >
                                {reportTypeOptions.map((rt) => (
                                    <option key={rt} value={rt}>
                                        {rt}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.report_type?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="range_start">Range start (optional)</Label>
                            <Input id="range_start" type="date" {...register('range_start')} />
                            <InputError message={errors.range_start?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="range_end">Range end (optional)</Label>
                            <Input id="range_end" type="date" {...register('range_end')} />
                            <InputError message={errors.range_end?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="client_type">Client type (optional)</Label>
                            <select
                                id="client_type"
                                className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-sm"
                                {...register('client_type')}
                            >
                                <option value="">All</option>
                                <option value="individual">Individual</option>
                                <option value="corporate">Corporate</option>
                            </select>
                            <InputError message={errors.client_type?.message} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="policy_type">Policy type (optional)</Label>
                            <select
                                id="policy_type"
                                className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-sm"
                                {...register('policy_type')}
                            >
                                <option value="">All</option>
                                <option value="medical">Medical</option>
                                <option value="motor">Motor</option>
                                <option value="wiba">WIBA</option>
                            </select>
                            <InputError message={errors.policy_type?.message} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status (optional)</Label>
                            <select
                                id="status"
                                className="h-9 w-full rounded border border-input bg-background px-3 py-1 text-sm"
                                {...register('status')}
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="lapsed">Lapsed</option>
                                <option value="expired">Expired</option>
                                <option value="renewed">Renewed</option>
                            </select>
                            <InputError message={errors.status?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" {...register('notes')} />
                        <InputError message={errors.notes?.message} />
                    </div>

                    <CardFooter className="px-0">
                        <div className="flex w-full items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => (window.location.href = onCancelHref)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : submitLabel}
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
}

