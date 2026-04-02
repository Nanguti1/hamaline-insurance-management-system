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

export const claimSchema = z.object({
    policy_id: z.coerce.number().int().min(1),
    claim_number: z.string().trim().max(50).optional().or(z.literal('')),
    claimant_name: z.string().trim().min(1).max(255),
    loss_date: z.string().trim().min(1),
    reported_at: z.string().trim().min(1),
    claim_amount: z.coerce.number().nonnegative(),
    currency: z.string().trim().max(3),
    status: z.enum(['submitted', 'assessing', 'approved', 'declined', 'settled']),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type ClaimFormValues = z.infer<typeof claimSchema>;

type SelectOption = { id: number; label: string };

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    onCancelHref: string;
    initialValues?: Partial<ClaimFormValues> & { notes?: string | null };
    policies: SelectOption[];
};

export default function ClaimForm({
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
    } = useForm<ClaimFormValues>({
        resolver: zodResolver(claimSchema) as any,
        defaultValues: {
            policy_id: initialValues?.policy_id ?? 0,
            claim_number: initialValues?.claim_number ?? '',
            claimant_name: initialValues?.claimant_name ?? '',
            loss_date: initialValues?.loss_date ?? '',
            reported_at: initialValues?.reported_at ?? '',
            claim_amount: initialValues?.claim_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            status: initialValues?.status ?? 'submitted',
            notes: initialValues?.notes ?? '',
        },
    });

    const policyId = watch('policy_id');
    const status = watch('status');

    const submit = (values: ClaimFormValues) => {
        const payload = {
            ...values,
            claim_number: values.claim_number ? values.claim_number : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof ClaimFormValues, { message: String(message) });
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
                            onValueChange={(value) => {
                                setValue('policy_id', Number(value), { shouldValidate: true });
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

                    <div className="grid gap-2">
                        <Label htmlFor="claim_number">Claim number (optional)</Label>
                        <Input id="claim_number" placeholder="Auto-generated if blank (e.g. CLM-2026-0001)" {...register('claim_number')} />
                        <InputError message={errors.claim_number?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="claimant_name">Claimant name</Label>
                        <Input
                            id="claimant_name"
                            placeholder="Full name"
                            {...register('claimant_name')}
                        />
                        <InputError message={errors.claimant_name?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="loss_date">Loss date</Label>
                            <Input id="loss_date" type="date" {...register('loss_date')} />
                            <InputError message={errors.loss_date?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reported_at">Reported at</Label>
                            <Input id="reported_at" type="date" {...register('reported_at')} />
                            <InputError message={errors.reported_at?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="claim_amount">Claim amount</Label>
                            <Input
                                id="claim_amount"
                                type="number"
                                step="0.01"
                                {...register('claim_amount')}
                            />
                            <InputError message={errors.claim_amount?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="KES" />
                            <InputError message={errors.currency?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) =>
                                setValue('status', value as ClaimFormValues['status'], {
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="assessing">Assessing</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                                <SelectItem value="settled">Settled</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status?.message} />
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

