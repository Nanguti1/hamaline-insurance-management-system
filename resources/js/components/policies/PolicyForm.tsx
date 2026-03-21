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

export const policySchema = z
    .object({
        client_id: z.coerce.number().int().min(1),
        underwriter_id: z.coerce.number().int().min(1),
        quotation_id: z.coerce.number().int().min(0),
        policy_number: z.string().trim().min(1).max(50),
        policy_type: z.string().trim().max(100).optional().or(z.literal('')),
        status: z.enum(['active', 'lapsed', 'cancelled', 'expired', 'renewed']),
        start_date: z.string().trim().min(1),
        end_date: z.string().trim().min(1),
        premium_amount: z.coerce.number().nonnegative(),
        currency: z.string().trim().max(3),
        notes: z.string().trim().max(5000).optional().or(z.literal('')),
    })
    .strict();

export type PolicyFormValues = z.infer<typeof policySchema>;

type SelectOption = { id: number; label: string };

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<PolicyFormValues> & {
        quotation_id?: number | null;
        policy_type?: string | null;
        notes?: string | null;
    };
    clients: SelectOption[];
    underwriters: SelectOption[];
    quotations: SelectOption[];
};

export default function PolicyForm({
    title,
    submitLabel,
    method,
    submitUrl,
    onCancelHref,
    initialValues,
    clients,
    underwriters,
    quotations,
}: Props) {
    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<PolicyFormValues>({
        resolver: zodResolver(policySchema) as any,
        defaultValues: {
            client_id: initialValues?.client_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            quotation_id: initialValues?.quotation_id ?? 0,
            policy_number: initialValues?.policy_number ?? '',
            policy_type: initialValues?.policy_type ?? '',
            status: initialValues?.status ?? 'active',
            start_date: initialValues?.start_date ?? '',
            end_date: initialValues?.end_date ?? '',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            notes: initialValues?.notes ?? '',
        },
    });

    const clientId = watch('client_id');
    const underwriterId = watch('underwriter_id');
    const quotationId = watch('quotation_id');
    const status = watch('status');

    const submit = (values: PolicyFormValues) => {
        const payload = {
            ...values,
            quotation_id: values.quotation_id ? values.quotation_id : null,
            policy_type: values.policy_type ? values.policy_type : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof PolicyFormValues, {
                    message: String(message),
                });
            });
        };

        if (method === 'post') {
            router.post(submitUrl, payload, {
                preserveScroll: true,
                onError,
            });
            return;
        }

        router.put(submitUrl, payload, {
            preserveScroll: true,
            onError,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
                    <div className="grid gap-2">
                        <Label>Client</Label>
                        <Select
                            value={clientId ? String(clientId) : ''}
                            onValueChange={(value) => {
                                setValue('client_id', Number(value), {
                                    shouldValidate: true,
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.client_id?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Underwriter</Label>
                        <Select
                            value={underwriterId ? String(underwriterId) : ''}
                            onValueChange={(value) => {
                                setValue('underwriter_id', Number(value), {
                                    shouldValidate: true,
                                });
                            }}
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
                        <Label>Quotation (optional)</Label>
                        <Select
                            value={quotationId ? String(quotationId) : '0'}
                            onValueChange={(value) => {
                                setValue('quotation_id', Number(value), {
                                    shouldValidate: true,
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="No quotation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">No quotation</SelectItem>
                                {quotations.map((q) => (
                                    <SelectItem key={q.id} value={String(q.id)}>
                                        {q.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.quotation_id?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="policy_number">Policy number</Label>
                        <Input
                            id="policy_number"
                            placeholder="e.g. POL-0001"
                            {...register('policy_number')}
                        />
                        <InputError message={errors.policy_number?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="policy_type">Policy type (optional)</Label>
                        <Input id="policy_type" {...register('policy_type')} />
                        <InputError message={errors.policy_type?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                setValue('status', value as PolicyFormValues['status'], {
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="lapsed">Lapsed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="renewed">Renewed</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Start date</Label>
                            <Input id="start_date" type="date" {...register('start_date')} />
                            <InputError message={errors.start_date?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_date">End date</Label>
                            <Input id="end_date" type="date" {...register('end_date')} />
                            <InputError message={errors.end_date?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="premium_amount">Premium amount</Label>
                            <Input
                                id="premium_amount"
                                type="number"
                                step="0.01"
                                {...register('premium_amount')}
                            />
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

