import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const commissionSchema = z.object({
    policy_id: z.coerce.number().int().min(1),
    underwriter_id: z.coerce.number().int().min(1),
    commission_number: z.string().trim().min(1).max(50),
    percentage: z.coerce.number().min(0).max(100),
    amount: z.coerce.number().nonnegative(),
    currency: z.string().trim().max(3),
    status: z.enum(['pending', 'paid', 'cancelled']),
    period_start: z.string().trim().optional().or(z.literal('')),
    period_end: z.string().trim().optional().or(z.literal('')),
    paid_at: z.string().trim().optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type CommissionFormValues = z.infer<typeof commissionSchema>;

type SelectOption = { id: number; label: string };

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<CommissionFormValues> & {
        percentage?: number | null;
        notes?: string | null;
        period_start?: string | null;
        period_end?: string | null;
        paid_at?: string | null;
    };
    policies: PolicyOption[];
    underwriters: SelectOption[];
};

export default function CommissionForm({
    title,
    submitLabel,
    method,
    submitUrl,
    onCancelHref,
    initialValues,
    policies,
    underwriters,
}: Props) {
    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<CommissionFormValues>({
        resolver: zodResolver(commissionSchema) as any,
        defaultValues: {
            policy_id: initialValues?.policy_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            commission_number: initialValues?.commission_number ?? '',
            percentage: initialValues?.percentage ?? 0,
            amount: initialValues?.amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            status: initialValues?.status ?? 'pending',
            period_start: initialValues?.period_start ?? '',
            period_end: initialValues?.period_end ?? '',
            paid_at: initialValues?.paid_at ?? '',
            notes: initialValues?.notes ?? '',
        },
    });

    const policyId = watch('policy_id');
    const underwriterId = watch('underwriter_id');
    const status = watch('status');

    useEffect(() => {
        const p = policies.find((x) => x.id === policyId);
        if (!p) {
            return;
        }
        const premium = Number(p.premium_amount);
        setValue('underwriter_id', p.underwriter_id, { shouldValidate: true });
        setValue('percentage', 10, { shouldValidate: true });
        setValue('amount', Math.round(premium * 0.1 * 100) / 100, { shouldValidate: true });
        setValue('currency', p.currency, { shouldValidate: true });
    }, [policyId, policies, setValue]);

    const submit = (values: CommissionFormValues) => {
        const payload = {
            ...values,
            percentage: values.percentage ? values.percentage : null,
            period_start: values.period_start ? values.period_start : null,
            period_end: values.period_end ? values.period_end : null,
            paid_at: values.paid_at ? values.paid_at : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof CommissionFormValues, { message: String(message) });
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
                            onValueChange={(value) =>
                                setValue('policy_id', Number(value), { shouldValidate: true })
                            }
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
                        <Label>Underwriter</Label>
                        <Select
                            value={underwriterId ? String(underwriterId) : ''}
                            onValueChange={(value) =>
                                setValue('underwriter_id', Number(value), { shouldValidate: true })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select underwriter" />
                            </SelectTrigger>
                            <SelectContent>
                                {underwriters.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.underwriter_id?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="commission_number">Commission number</Label>
                        <Input
                            id="commission_number"
                            placeholder="e.g. COM-0001"
                            {...register('commission_number')}
                        />
                        <InputError message={errors.commission_number?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="percentage">Percentage (fixed)</Label>
                            <Input
                                id="percentage"
                                type="number"
                                step="0.01"
                                readOnly
                                className="bg-muted"
                                {...register('percentage')}
                                placeholder="10"
                            />
                            <InputError message={errors.percentage?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (10% of premium)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                readOnly
                                className="bg-muted"
                                {...register('amount')}
                            />
                            <InputError message={errors.amount?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="KES" />
                            <InputError message={errors.currency?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setValue('status', value as CommissionFormValues['status'], { shouldValidate: true })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="period_start">Period start</Label>
                            <Input id="period_start" type="date" {...register('period_start')} />
                            <InputError message={errors.period_start?.message} />
                        </div>
                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="period_end">Period end</Label>
                            <Input id="period_end" type="date" {...register('period_end')} />
                            <InputError message={errors.period_end?.message} />
                        </div>
                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="paid_at">Paid at</Label>
                            <Input id="paid_at" type="date" {...register('paid_at')} />
                            <InputError message={errors.paid_at?.message} />
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

