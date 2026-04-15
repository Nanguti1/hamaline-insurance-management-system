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

const policyTypeOptions = ['motor', 'medical', 'wiba'] as const;
const policyTypeSelectValues = policyTypeOptions;

function buildQuotationSchema(method: 'post' | 'put') {
    return z
        .object({
            client_id: z.coerce.number().int().min(1),
            underwriter_id: z.coerce.number().int().min(1),
            insurer_id: z.coerce.number().int().min(1),
            quotation_number:
                method === 'put'
                    ? z.string().trim().min(1).max(50)
                    : z.string().trim().max(50).optional().or(z.literal('')),
            status: z.enum(['draft', 'issued', 'approved', 'rejected', 'expired']),
            premium_amount: z.coerce.number().nonnegative(),
            currency: z.string().trim().max(3).default('KES'),
            valid_until: z.string().trim().min(1),
            notes: z.string().trim().max(2000).optional().or(z.literal('')),
            policy_type: z.enum(policyTypeSelectValues),
            payment_plan: z.enum(['one_off', 'installments']),
            installment_count: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().int().min(2).max(10).optional(),
            ),
            vehicle_class: z.string().trim().max(100).optional().or(z.literal('')),
            vehicle_make_model: z.string().trim().max(150).optional().or(z.literal('')),
            year_of_manufacture: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().int().min(1900).max(2100).optional(),
            ),
            registration_number: z.string().trim().max(50).optional().or(z.literal('')),
            sum_insured: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().nonnegative().optional(),
            ),
            quoted_base_premium: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().nonnegative().optional(),
            ),
            quoted_training_levy: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().nonnegative().optional(),
            ),
            quoted_phcf: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().nonnegative().optional(),
            ),
            quoted_stamp_duty: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().nonnegative().optional(),
            ),
            quoted_total_premium: z.preprocess(
                (val) => {
                    if (val === '' || val === undefined || val === null) {
                        return undefined;
                    }
                    const n = Number(val);
                    return Number.isNaN(n) ? undefined : n;
                },
                z.number().nonnegative().optional(),
            ),
            interests_insured: z.string().trim().max(6000).optional().or(z.literal('')),
            excess_remarks: z.string().trim().max(6000).optional().or(z.literal('')),
            prepared_by: z.string().trim().max(150).optional().or(z.literal('')),
            reviewed_by: z.string().trim().max(150).optional().or(z.literal('')),
            quoted_on: z.string().trim().optional().or(z.literal('')),
        })
        .superRefine((data, ctx) => {
            if (data.payment_plan === 'installments') {
                const c = data.installment_count;
                if (c === undefined || c < 2 || c > 10) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Installments must be between 2 and 10 equal parts.',
                        path: ['installment_count'],
                    });
                }
            }
        });
}

export type QuotationFormValues = z.infer<ReturnType<typeof buildQuotationSchema>>;

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
        insurer_id?: number | null;
        premium_amount?: number | null;
        notes?: string | null;
        currency?: string | null;
        policy_type?: string | null;
        payment_plan?: 'one_off' | 'installments' | null;
        installment_count?: number | null;
        vehicle_class?: string | null;
        vehicle_make_model?: string | null;
        year_of_manufacture?: number | null;
        registration_number?: string | null;
        sum_insured?: number | null;
        quoted_base_premium?: number | null;
        quoted_training_levy?: number | null;
        quoted_phcf?: number | null;
        quoted_stamp_duty?: number | null;
        quoted_total_premium?: number | null;
        interests_insured?: string | null;
        excess_remarks?: string | null;
        prepared_by?: string | null;
        reviewed_by?: string | null;
        quoted_on?: string | null;
    };
    clients: SelectOption[];
    underwriters: Array<SelectOption & { insurers?: Array<SelectOption> }>;
    insurers?: SelectOption[];
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
    insurers,
}: Props) {
    const schema = buildQuotationSchema(method);

    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<QuotationFormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            client_id: initialValues?.client_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            insurer_id: initialValues?.insurer_id ?? 0,
            quotation_number: initialValues?.quotation_number ?? '',
            status: initialValues?.status ?? 'draft',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            valid_until: initialValues?.valid_until ?? '',
            notes: initialValues?.notes ?? '',
            policy_type: (initialValues?.policy_type as QuotationFormValues['policy_type']) ?? 'motor',
            payment_plan: initialValues?.payment_plan ?? 'one_off',
            installment_count: initialValues?.payment_plan === 'installments' ? (initialValues?.installment_count ?? 4) : undefined,
            vehicle_class: initialValues?.vehicle_class ?? 'MOTOR PRIVATE',
            vehicle_make_model: initialValues?.vehicle_make_model ?? '',
            year_of_manufacture: initialValues?.year_of_manufacture ?? undefined,
            registration_number: initialValues?.registration_number ?? '',
            sum_insured: initialValues?.sum_insured ?? undefined,
            quoted_base_premium: initialValues?.quoted_base_premium ?? undefined,
            quoted_training_levy: initialValues?.quoted_training_levy ?? undefined,
            quoted_phcf: initialValues?.quoted_phcf ?? undefined,
            quoted_stamp_duty: initialValues?.quoted_stamp_duty ?? undefined,
            quoted_total_premium: initialValues?.quoted_total_premium ?? undefined,
            interests_insured: initialValues?.interests_insured ?? '',
            excess_remarks: initialValues?.excess_remarks ?? '',
            prepared_by: initialValues?.prepared_by ?? '',
            reviewed_by: initialValues?.reviewed_by ?? '',
            quoted_on: initialValues?.quoted_on ?? '',
        },
    });

    const clientId = watch('client_id');
    const underwriterId = watch('underwriter_id');
    const insurerId = watch('insurer_id');
    const status = watch('status');
    const paymentPlan = watch('payment_plan');
    const policyType = watch('policy_type');
    const notes = watch('notes');

    const underwriterInsurers = underwriters.find((u) => u.id === underwriterId)?.insurers;
    const allowedInsurers = underwriterInsurers && underwriterInsurers.length > 0 ? underwriterInsurers : insurers ?? [];

    useEffect(() => {
        if (! allowedInsurers || allowedInsurers.length === 0) {
            return;
        }
        if (! insurerId || ! allowedInsurers.some((i) => i.id === insurerId)) {
            // Auto-pick the first available insurer for the chosen underwriter.
            setValue('insurer_id', allowedInsurers[0]!.id, { shouldValidate: true });
        }
    }, [allowedInsurers, insurerId, setValue]);

    useEffect(() => {
        if (! clientId || ! underwriterId || ! insurerId || ! policyType) {
            return;
        }
        // Debounce so we don't spam the backend while the user is adjusting dropdowns.
        const t = setTimeout(async () => {
            try {
                const url = new URL('/quotations/suggestions', window.location.origin);
                url.searchParams.set('client_id', String(clientId));
                url.searchParams.set('underwriter_id', String(underwriterId));
                url.searchParams.set('insurer_id', String(insurerId));
                url.searchParams.set('policy_type', policyType);

                const res = await fetch(url.toString(), { method: 'GET' });
                if (! res.ok) return;
                const data = (await res.json()) as {
                    premium_amount?: number | string | null;
                    currency?: string | null;
                    valid_until?: string | null;
                    notes?: string | null;
                    payment_plan?: 'one_off' | 'installments' | null;
                    installment_count?: number | null;
                    policy_type?: string | null;
                };

                if (data.premium_amount !== undefined && data.premium_amount !== null) {
                    setValue('premium_amount', Number(data.premium_amount), { shouldValidate: true });
                }
                if (data.currency) {
                    setValue('currency', data.currency, { shouldValidate: true });
                }
                if (data.valid_until) {
                    setValue('valid_until', data.valid_until, { shouldValidate: true });
                }

                // Don't overwrite user input unless the field is empty.
                if (notes === '' && data.notes) {
                    setValue('notes', data.notes, { shouldValidate: true });
                }
                if (data.payment_plan && data.payment_plan !== paymentPlan) {
                    setValue('payment_plan', data.payment_plan, { shouldValidate: true });
                    if (data.payment_plan === 'installments') {
                        setValue('installment_count', data.installment_count && data.installment_count >= 2 && data.installment_count <= 10 ? data.installment_count : 4, { shouldValidate: true });
                    }
                }
            } catch {
                // Best-effort auto-fill; silently ignore failures.
            }
        }, 400);

        return () => clearTimeout(t);
    }, [clientId, underwriterId, insurerId, policyType, notes, paymentPlan, setValue]);

    const submit = (values: QuotationFormValues) => {
        const payload: Record<string, unknown> = {
            client_id: values.client_id,
            underwriter_id: values.underwriter_id,
            insurer_id: values.insurer_id,
            status: values.status,
            premium_amount: values.premium_amount,
            currency: values.currency,
            valid_until: values.valid_until,
            notes: values.notes ? values.notes : null,
            policy_type: values.policy_type,
            payment_plan: values.payment_plan,
            installment_count: values.payment_plan === 'installments' ? values.installment_count : null,
            vehicle_class: values.vehicle_class || null,
            vehicle_make_model: values.vehicle_make_model || null,
            year_of_manufacture: values.year_of_manufacture ?? null,
            registration_number: values.registration_number || null,
            sum_insured: values.sum_insured ?? null,
            quoted_base_premium: values.quoted_base_premium ?? null,
            quoted_training_levy: values.quoted_training_levy ?? null,
            quoted_phcf: values.quoted_phcf ?? null,
            quoted_stamp_duty: values.quoted_stamp_duty ?? null,
            quoted_total_premium: values.quoted_total_premium ?? null,
            interests_insured: values.interests_insured || null,
            excess_remarks: values.excess_remarks || null,
            prepared_by: values.prepared_by || null,
            reviewed_by: values.reviewed_by || null,
            quoted_on: values.quoted_on || null,
        };

        if (method === 'put') {
            payload.quotation_number = values.quotation_number;
        } else if (values.quotation_number && String(values.quotation_number).trim() !== '') {
            payload.quotation_number = String(values.quotation_number).trim();
        }

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
                        <Label>Company (insurer)</Label>
                        <Select
                            value={insurerId ? String(insurerId) : ''}
                            onValueChange={(value) => {
                                setValue('insurer_id', Number(value), {
                                    shouldValidate: true,
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedInsurers.map((i) => (
                                    <SelectItem key={i.id} value={String(i.id)}>
                                        {i.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.insurer_id?.message} />
                    </div>

                    {method === 'put' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="quotation_number">Quotation number</Label>
                            <Input id="quotation_number" {...register('quotation_number')} />
                            <InputError message={errors.quotation_number?.message} />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Quotation number will be assigned automatically when you create this quote.
                        </p>
                    )}

                    <div className="grid gap-2">
                        <Label>Type of policy</Label>
                        <Select
                            value={String(watch('policy_type'))}
                            onValueChange={(value) =>
                                setValue('policy_type', value as QuotationFormValues['policy_type'], {
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="motor">Motor</SelectItem>
                                <SelectItem value="medical">Medical</SelectItem>
                                <SelectItem value="wiba">WIBA</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.policy_type?.message as string | undefined} />
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

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Payment terms</Label>
                            <Select
                                value={paymentPlan}
                                onValueChange={(value) => {
                                    setValue('payment_plan', value as QuotationFormValues['payment_plan'], {
                                        shouldValidate: true,
                                    });
                                    if (value === 'one_off') {
                                        setValue('installment_count', undefined, { shouldValidate: true });
                                    } else {
                                        setValue('installment_count', 4, { shouldValidate: true });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="one_off">One-off payment</SelectItem>
                                    <SelectItem value="installments">Installments (equal amounts)</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.payment_plan?.message} />
                        </div>
                        {paymentPlan === 'installments' && (
                            <div className="grid gap-2">
                                <Label htmlFor="installment_count">Installment count</Label>
                                <Input id="installment_count" type="number" min={2} max={10} {...register('installment_count', { valueAsNumber: true })} />
                                <InputError message={errors.installment_count?.message} />
                            </div>
                        )}
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

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vehicle_class">Class</Label>
                            <Input id="vehicle_class" {...register('vehicle_class')} placeholder="MOTOR PRIVATE" />
                            <InputError message={errors.vehicle_class?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="registration_number">Registration</Label>
                            <Input id="registration_number" {...register('registration_number')} placeholder="KDS 912T" />
                            <InputError message={errors.registration_number?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vehicle_make_model">Make / model</Label>
                            <Input id="vehicle_make_model" {...register('vehicle_make_model')} placeholder="Toyota Probox" />
                            <InputError message={errors.vehicle_make_model?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="year_of_manufacture">Year of manufacture</Label>
                            <Input id="year_of_manufacture" type="number" min={1900} max={2100} {...register('year_of_manufacture', { valueAsNumber: true })} />
                            <InputError message={errors.year_of_manufacture?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="sum_insured">Sum insured</Label>
                            <Input id="sum_insured" type="number" step="0.01" {...register('sum_insured', { valueAsNumber: true })} />
                            <InputError message={errors.sum_insured?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quoted_base_premium">Base premium</Label>
                            <Input id="quoted_base_premium" type="number" step="0.01" {...register('quoted_base_premium', { valueAsNumber: true })} />
                            <InputError message={errors.quoted_base_premium?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quoted_total_premium">Total premium</Label>
                            <Input id="quoted_total_premium" type="number" step="0.01" {...register('quoted_total_premium', { valueAsNumber: true })} />
                            <InputError message={errors.quoted_total_premium?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="quoted_training_levy">Training levy</Label>
                            <Input id="quoted_training_levy" type="number" step="0.01" {...register('quoted_training_levy', { valueAsNumber: true })} />
                            <InputError message={errors.quoted_training_levy?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quoted_phcf">PHCF</Label>
                            <Input id="quoted_phcf" type="number" step="0.01" {...register('quoted_phcf', { valueAsNumber: true })} />
                            <InputError message={errors.quoted_phcf?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quoted_stamp_duty">Stamp duty</Label>
                            <Input id="quoted_stamp_duty" type="number" step="0.01" {...register('quoted_stamp_duty', { valueAsNumber: true })} />
                            <InputError message={errors.quoted_stamp_duty?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="interests_insured">Interests insured / benefits</Label>
                        <Textarea id="interests_insured" rows={6} {...register('interests_insured')} />
                        <InputError message={errors.interests_insured?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="excess_remarks">Excess / remarks</Label>
                        <Textarea id="excess_remarks" rows={6} {...register('excess_remarks')} />
                        <InputError message={errors.excess_remarks?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="prepared_by">Prepared by</Label>
                            <Input id="prepared_by" {...register('prepared_by')} />
                            <InputError message={errors.prepared_by?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reviewed_by">Reviewed by</Label>
                            <Input id="reviewed_by" {...register('reviewed_by')} />
                            <InputError message={errors.reviewed_by?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quoted_on">Quoted on</Label>
                            <Input id="quoted_on" type="date" {...register('quoted_on')} />
                            <InputError message={errors.quoted_on?.message} />
                        </div>
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
