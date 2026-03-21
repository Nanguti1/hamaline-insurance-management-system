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

export const quotationSchema = z
    .object({
        client_id: z.coerce.number().int().min(1),
        underwriter_id: z.coerce.number().int().min(1),
        quotation_number: z.string().trim().min(1).max(50),
        status: z.enum(['draft', 'issued', 'approved', 'rejected', 'expired']),
        premium_amount: z.coerce.number().nonnegative(),
        currency: z.string().trim().max(3).default('KES'),
        valid_until: z.string().trim().min(1),
        notes: z.string().trim().max(2000).optional().or(z.literal('')),
    })
    .strict();

export type QuotationFormValues = z.infer<typeof quotationSchema>;

type SelectOption = {
    id: number;
    label: string;
};

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<QuotationFormValues> & {
        client_id?: number | null;
        underwriter_id?: number | null;
        premium_amount?: number | null;
        notes?: string | null;
        currency?: string | null;
    };
    clients: SelectOption[];
    underwriters: SelectOption[];
};

export default function QuotationForm({
    title,
    submitLabel,
    method,
    submitUrl,
    onCancelHref,
    initialValues,
    clients,
    underwriters,
}: Props) {
    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationSchema) as any,
        defaultValues: {
            client_id: initialValues?.client_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            quotation_number: initialValues?.quotation_number ?? '',
            status: initialValues?.status ?? 'draft',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            valid_until: initialValues?.valid_until ?? '',
            notes: initialValues?.notes ?? '',
        },
    });

    const clientId = watch('client_id');
    const underwriterId = watch('underwriter_id');
    const status = watch('status');

    const submit = (values: QuotationFormValues) => {
        const payload = {
            ...values,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof QuotationFormValues, {
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
                        <Label htmlFor="quotation_number">Quotation number</Label>
                        <Input
                            id="quotation_number"
                            placeholder="e.g. QTN-0001"
                            {...register('quotation_number')}
                        />
                        <InputError message={errors.quotation_number?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                setValue('status', value as QuotationFormValues['status'], {
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="issued">Issued</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.message} />
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
                        <Label htmlFor="valid_until">Valid until</Label>
                        <Input id="valid_until" type="date" {...register('valid_until')} />
                        <InputError message={errors.valid_until?.message} />
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

