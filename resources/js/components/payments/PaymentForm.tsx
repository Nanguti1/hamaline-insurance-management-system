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

export const paymentSchema = z.object({
    policy_id: z.coerce.number().int().min(1),
    flow: z.enum(['in', 'out']),
    payment_number: z.string().trim().min(1).max(50),
    amount: z.coerce.number().nonnegative(),
    currency: z.string().trim().max(3),
    method: z.string().trim().min(1).max(30),
    status: z.enum(['pending', 'received', 'reversed']),
    paid_at: z.string().trim().optional().or(z.literal('')),
    reference: z.string().trim().min(1).max(255),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
    proof: z.any().optional().refine((f) => f instanceof File || f === null || f === undefined, {
        message: 'Attach proof of payment.',
    }),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

type SelectOption = { id: number; label: string };

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<PaymentFormValues> & {
        reference?: string | null;
        notes?: string | null;
        paid_at?: string | null;
    };
    policies: SelectOption[];
};

export default function PaymentForm({
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
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            policy_id: initialValues?.policy_id ?? 0,
            flow: initialValues?.flow ?? 'in',
            payment_number: initialValues?.payment_number ?? '',
            amount: initialValues?.amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            method: initialValues?.method ?? 'bank',
            status: initialValues?.status ?? 'pending',
            paid_at: initialValues?.paid_at ?? '',
            reference: initialValues?.reference ?? '',
            notes: initialValues?.notes ?? '',
            proof: undefined,
        },
    });

    const policyId = watch('policy_id');
    const flow = watch('flow');
    const status = watch('status');

    const submit = (values: PaymentFormValues) => {
        const payload: Record<string, unknown> = {
            ...values,
            paid_at: values.paid_at ? values.paid_at : null,
            reference: values.reference ? values.reference : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof PaymentFormValues, { message: String(message) });
            });
        };

        if (method === 'post') {
            router.post(submitUrl, payload, { preserveScroll: true, onError, forceFormData: true });
            return;
        }

        router.put(submitUrl, payload, { preserveScroll: true, onError, forceFormData: true });
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
                            onValueChange={(value) => {
                                setValue('policy_id', Number(value), {
                                    shouldValidate: true,
                                });
                            }}
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

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Payment type</Label>
                            <Select
                                value={flow}
                                onValueChange={(value) =>
                                    setValue('flow', value as PaymentFormValues['flow'], {
                                        shouldValidate: true,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in">Payment in (from client)</SelectItem>
                                    <SelectItem value="out">Payment out (to insurer/vendor)</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.flow?.message as string | undefined} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="payment_number">Payment number</Label>
                        <Input
                            id="payment_number"
                            placeholder="e.g. PAY-0001"
                            {...register('payment_number')}
                        />
                        <InputError message={errors.payment_number?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" step="0.01" {...register('amount')} />
                            <InputError message={errors.amount?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="KES" />
                            <InputError message={errors.currency?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="method">Method</Label>
                            <Input id="method" placeholder="bank/cash/card" {...register('method')} />
                            <InputError message={errors.method?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setValue('status', value as PaymentFormValues['status'], {
                                        shouldValidate: true,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="reversed">Reversed</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="paid_at">Paid at (optional)</Label>
                            <Input id="paid_at" type="date" {...register('paid_at')} />
                            <InputError message={errors.paid_at?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reference">Reference (receipt / MPESA / bank code)</Label>
                            <Input id="reference" {...register('reference')} placeholder="e.g. QWE123XYZ" />
                            <InputError message={errors.reference?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" {...register('notes')} />
                        <InputError message={errors.notes?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="proof">Proof of payment (required)</Label>
                        <Input id="proof" type="file" onChange={(e) => setValue('proof', e.target.files?.[0] ?? null)} />
                        <InputError message={(errors as any).proof?.message} />
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

