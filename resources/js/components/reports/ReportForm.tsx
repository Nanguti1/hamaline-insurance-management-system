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

export const reportSchema = z.object({
    report_type: z.literal('overview'),
    title: z.string().trim().min(1).max(255),
    range_start: z.string().trim().optional().or(z.literal('')),
    range_end: z.string().trim().optional().or(z.literal('')),
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
            report_type: 'overview',
            title: initialValues?.title ?? 'Overview report',
            range_start: initialValues?.range_start ?? '',
            range_end: initialValues?.range_end ?? '',
            notes: initialValues?.notes ?? '',
        },
    });

    const submit = (values: ReportFormValues) => {
        const payload = {
            ...values,
            range_start: values.range_start ? values.range_start : null,
            range_end: values.range_end ? values.range_end : null,
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
                    <input type="hidden" {...register('report_type')} />

                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" {...register('title')} />
                        <InputError message={errors.title?.message} />
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

