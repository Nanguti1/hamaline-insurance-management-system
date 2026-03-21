import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const renewalSchema = z.object({
    policy_id: z.coerce.number().int().min(1),
    renewal_number: z.string().trim().min(1).max(50),
    status: z.enum(['scheduled', 'completed', 'cancelled']),
    renewal_date: z.string().trim().min(1),
    new_end_date: z.string().trim().optional().or(z.literal('')),
    premium_amount: z.coerce.number().nonnegative(),
    currency: z.string().trim().max(3),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type RenewalFormValues = z.infer<typeof renewalSchema>;

type SelectOption = { id: number; label: string };

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<RenewalFormValues> & { notes?: string | null; new_end_date?: string | null };
    policies: SelectOption[];
};

export default function RenewalForm({
    title,
    submitLabel,
    method,
    submitUrl,
    onCancelHref,
    initialValues,
    policies,
}: Props) {
    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RenewalFormValues>({
        resolver: zodResolver(renewalSchema) as any,
        defaultValues: {
            policy_id: initialValues?.policy_id ?? 0,
            renewal_number: initialValues?.renewal_number ?? '',
            status: initialValues?.status ?? 'scheduled',
            renewal_date: initialValues?.renewal_date ?? '',
            new_end_date: initialValues?.new_end_date ?? '',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            notes: initialValues?.notes ?? '',
        },
    });

    const policyId = watch('policy_id');
    const status = watch('status');

    const submit = (values: RenewalFormValues) => {
        const payload = {
            ...values,
            new_end_date: values.new_end_date ? values.new_end_date : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof RenewalFormValues, { message: String(message) });
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
                        <Label>Policy</Label>
                        <Select
                            value={policyId ? String(policyId) : ''}
                            onValueChange={(value) => setValue('policy_id', Number(value), { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select policy" />
                            </SelectTrigger>
                            <SelectContent>
                                {policies.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.policy_id?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="renewal_number">Renewal number</Label>
                        <Input
                            id="renewal_number"
                            placeholder="e.g. REN-0001"
                            {...register('renewal_number')}
                        />
                        <InputError message={errors.renewal_number?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                setValue('status', value as RenewalFormValues['status'], { shouldValidate: true })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="renewal_date">Renewal date</Label>
                            <Input id="renewal_date" type="date" {...register('renewal_date')} />
                            <InputError message={errors.renewal_date?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new_end_date">New end date (optional)</Label>
                            <Input id="new_end_date" type="date" {...register('new_end_date')} />
                            <InputError message={errors.new_end_date?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="premium_amount">Premium amount</Label>
                            <Input id="premium_amount" type="number" step="0.01" {...register('premium_amount')} />
                            <InputError message={errors.premium_amount?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="KES" />
                            <InputError message={errors.currency?.message} />
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

