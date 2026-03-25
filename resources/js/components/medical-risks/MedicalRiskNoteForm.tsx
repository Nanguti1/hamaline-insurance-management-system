import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const relationshipOptions = ['principal', 'spouse', 'child'] as const;
type Relationship = (typeof relationshipOptions)[number];

const planTypes = ['individual', 'junior', 'corporate'] as const;
type PlanType = (typeof planTypes)[number];

const benefitTypes = ['inpatient', 'outpatient', 'maternity', 'dental', 'optical'] as const;
type BenefitType = (typeof benefitTypes)[number];

const benefitLabels: Record<BenefitType, string> = {
    inpatient: 'Inpatient',
    outpatient: 'Outpatient',
    maternity: 'Maternity',
    dental: 'Dental',
    optical: 'Optical',
};

const corporateCategoryBenefits: Record<string, BenefitType[]> = {
    A: ['inpatient', 'outpatient', 'dental'],
    B: ['inpatient', 'outpatient', 'optical'],
    C: ['inpatient', 'maternity', 'dental'],
    D: ['inpatient', 'maternity', 'optical'],
    E: ['inpatient', 'outpatient', 'maternity', 'dental', 'optical'],
    F: ['inpatient', 'outpatient', 'dental', 'optical'],
};

const memberSchema = z.object({
    member_sequence: z.number().int().min(0),
    is_principal: z.boolean(),
    relationship: z.enum(relationshipOptions),
    name: z.string().trim().min(1).max(255),
    date_of_birth: z.string().trim().min(1),
    phone: z.string().trim().min(1).max(50),
    id_number: z.string().trim().max(50).nullable().optional(),
    birth_certificate_number: z.string().trim().max(50).nullable().optional(),
    benefits: z
        .array(
            z.object({
                benefit_type: z.enum(benefitTypes),
                amount: z.number().min(0),
            }),
        )
        .optional(),
});

const medicalRiskNoteSchema = z
    .object({
        client_id: z.coerce.number().int().min(1),
        underwriter_id: z.coerce.number().int().min(1),
        plan_type: z.enum(planTypes),
        corporate_category_code: z.string().trim().max(5).nullable().optional(),
        junior_children_count: z.coerce.number().int().min(1).max(50).nullable().optional(),
        start_date: z.string().trim().min(1),
        end_date: z.string().trim().min(1),
        premium_amount: z.coerce.number().min(0),
        currency: z.string().trim().max(3),
        notes: z.string().trim().max(2000).nullable().optional(),
        members: z.array(memberSchema).min(1),
    })
    .strict();

export type MedicalRiskNoteFormValues = z.infer<typeof medicalRiskNoteSchema>;

type Props = {
    title: string;
    submitLabel: string;
    submitUrl: string;
    onCancelHref: string;
    clients: Array<{ id: number; name?: string | null; company_name?: string | null }>;
    underwriters: Array<{ id: number; name?: string | null }>;
    initialValues?: Partial<MedicalRiskNoteFormValues>;
};

export default function MedicalRiskNoteForm({
    title,
    submitLabel,
    submitUrl,
    onCancelHref,
    clients,
    underwriters,
    initialValues,
}: Props) {
    const defaultPlanType = (initialValues?.plan_type as PlanType) ?? 'individual';
    const [planType, setPlanType] = useState<PlanType>(defaultPlanType);

    const schemaResolver = zodResolver(medicalRiskNoteSchema) as any;

    const {
        register,
        setValue,
        watch,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<MedicalRiskNoteFormValues>({
        resolver: schemaResolver,
        defaultValues: {
            client_id: initialValues?.client_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            plan_type: defaultPlanType,
            corporate_category_code: initialValues?.corporate_category_code ?? null,
            junior_children_count: initialValues?.junior_children_count ?? null,
            start_date: initialValues?.start_date ?? '',
            end_date: initialValues?.end_date ?? '',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            notes: initialValues?.notes ?? null,
            members:
                initialValues?.members ??
                [
                    {
                        member_sequence: 0,
                        is_principal: true,
                        relationship: 'principal',
                        name: '',
                        date_of_birth: '',
                        phone: '',
                        id_number: null,
                        birth_certificate_number: null,
                        benefits: [],
                    },
                ],
        },
    });

    type MedicalMemberBenefit = NonNullable<MedicalRiskNoteFormValues['members'][number]['benefits']>[number];

    const { fields, append, remove, replace } = useFieldArray({ control, name: 'members' });

    const currentMembers = watch('members');
    const principalIndex = currentMembers.findIndex((m) => m.is_principal);

    // React Hook Form won't re-render reliably off `watch('members')` if `benefits` is not registered.
    // Watching the exact benefits path ensures checkbox toggles update the UI instantly.
    const principalBenefitsPath = `members.${Math.max(principalIndex, 0)}.benefits` as any;
    const principalBenefits = watch(principalBenefitsPath) as MedicalMemberBenefit[] | undefined;
    const principalBenefitsByType = useMemo(() => {
        const map: Partial<Record<BenefitType, number>> = {};
        for (const b of principalBenefits ?? []) {
            map[b.benefit_type] = b.amount;
        }
        return map;
    }, [principalBenefits]);

    const enabledBenefits = useMemo(() => {
        const enabled = new Set<BenefitType>();
        for (const bt of benefitTypes) {
            const amount = principalBenefitsByType[bt];
            if (typeof amount === 'number') {
                enabled.add(bt);
            }
        }
        return enabled;
    }, [principalBenefitsByType]);

    const toggleBenefit = (type: BenefitType, enabled: boolean) => {
        const idx = currentMembers.findIndex((m) => m.is_principal);
        if (idx < 0) return;

        if (planType === 'corporate' && !allowedBenefitsForCorporate.includes(type)) return;

        const existing = principalBenefits ?? [];
        const without = existing.filter((b) => b.benefit_type !== type);
        if (!enabled) {
            setValue(`members.${idx}.benefits`, without);
            return;
        }

        const nextAmount = principalBenefitsByType[type] ?? 0;
        setValue(`members.${idx}.benefits`, [...without, { benefit_type: type, amount: nextAmount }]);
    };

    const setBenefitAmount = (type: BenefitType, amount: number) => {
        const idx = currentMembers.findIndex((m) => m.is_principal);
        if (idx < 0) return;

        if (planType === 'corporate' && !allowedBenefitsForCorporate.includes(type)) return;

        const existing = principalBenefits ?? [];
        const next = existing.some((b) => b.benefit_type === type)
            ? existing.map((b) => (b.benefit_type === type ? { ...b, amount } : b))
            : [...existing, { benefit_type: type, amount }];
        setValue(`members.${idx}.benefits`, next);
    };

    const juniorChildrenCount = watch('junior_children_count') ?? 0;
    const corporateCategoryCode = watch('corporate_category_code') ?? null;

    const showMaternity = planType !== 'junior';

    const canAddAdditionalMembers = planType === 'individual' || planType === 'corporate';

    const allowedBenefitsForCorporate = useMemo(() => {
        if (planType !== 'corporate') return benefitTypes;
        if (!corporateCategoryCode) return [] as BenefitType[];
        return corporateCategoryBenefits[corporateCategoryCode] ?? [];
    }, [planType, corporateCategoryCode]);

    // Keep members list aligned with junior children count (M + N children)
    const syncJuniorChildren = (count: number) => {
        const basePrincipal = currentMembers[0];
        const principal = basePrincipal?.is_principal
            ? basePrincipal
            : {
                  member_sequence: 0,
                  is_principal: true,
                  relationship: 'principal' as const,
                  name: '',
                  date_of_birth: '',
                  phone: '',
                  id_number: null,
                  birth_certificate_number: null,
                  benefits: [],
              };

        const additional = Array.from({ length: count }, (_, i) => {
            const seq = i + 1;
            const existing = currentMembers.find((m) => m.member_sequence === seq);
            return (
                existing ?? {
                    member_sequence: seq,
                    is_principal: false,
                    relationship: 'child' as const,
                    name: '',
                    date_of_birth: '',
                    phone: '',
                    id_number: null,
                    birth_certificate_number: null,
                    benefits: [],
                }
            );
        });

        replace([principal, ...additional]);
    };

    // Sync benefits auto-population for corporate categories
    const applyCorporateCategoryBenefits = (categoryCode: string) => {
        const allowed = corporateCategoryBenefits[categoryCode] ?? [];
        const principalIndex = currentMembers.findIndex((m) => m.is_principal);
        if (principalIndex < 0) return;

        // Set benefits array directly for deterministic updates.
        const nextBenefits = allowed.map((bt) => ({
            benefit_type: bt,
            amount: principalBenefitsByType[bt] ?? 0,
        }));

        setValue(`members.${principalIndex}.benefits`, nextBenefits as any, { shouldValidate: true });
    };

    const submit = (values: MedicalRiskNoteFormValues) => {
        const payload = {
            ...values,
            notes: values.notes ? values.notes : null,
            // Ensure plan_type is consistent with local state
            plan_type: planType,
            corporate_category_code: values.plan_type === 'corporate' ? values.corporate_category_code : null,
            junior_children_count: values.plan_type === 'junior' ? values.junior_children_count : null,
            // Only principal member carries benefits in this first-pass UI.
            members: values.members.map((m) => {
                if (!m.is_principal) return { ...m, benefits: [] };
                return m;
            }),
        };

        router.post(submitUrl, payload, {
            preserveScroll: true,
            onError: (serverErrors) => {
                Object.entries(serverErrors).forEach(([key, message]) => {
                    setError(key as any, { message: String(message) });
                });
            },
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
                            value={String(watch('client_id') || 0)}
                            onValueChange={(value) => setValue('client_id', Number(value), { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name ?? c.company_name ?? 'Client'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={(errors as any).client_id?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Underwriter</Label>
                        <Select
                            value={String(watch('underwriter_id') || 0)}
                            onValueChange={(value) => setValue('underwriter_id', Number(value), { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select underwriter" />
                            </SelectTrigger>
                            <SelectContent>
                                {underwriters.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name ?? 'Underwriter'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={(errors as any).underwriter_id?.message} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-1">
                            <Label>Plan Type</Label>
                            <Select
                                value={planType}
                                onValueChange={(value) => {
                                    const next = value as PlanType;
                                    setPlanType(next);
                                    setValue('plan_type', next, { shouldValidate: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">Individual</SelectItem>
                                    <SelectItem value="junior">Junior</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={(errors as any).plan_type?.message} />
                        </div>

                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="start_date">Start date</Label>
                            <Input id="start_date" type="date" {...register('start_date')} />
                            <InputError message={(errors as any).start_date?.message} />
                        </div>

                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="end_date">End date</Label>
                            <Input id="end_date" type="date" {...register('end_date')} />
                            <InputError message={(errors as any).end_date?.message} />
                        </div>
                    </div>

                    {planType === 'junior' && (
                        <div className="grid gap-2">
                            <Label htmlFor="junior_children_count">Number of children</Label>
                            <Input
                                id="junior_children_count"
                                type="number"
                                min={1}
                                {...register('junior_children_count', { valueAsNumber: true } as any)}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (!Number.isFinite(v) || v < 1) return;
                                    syncJuniorChildren(v);
                                }}
                            />
                            <InputError message={(errors as any).junior_children_count?.message} />
                        </div>
                    )}

                    {planType === 'corporate' && (
                        <div className="grid gap-2">
                            <Label>Corporate Category</Label>
                            <Select
                                value={corporateCategoryCode ?? ''}
                                onValueChange={(value) => {
                                    setValue('corporate_category_code', value, { shouldValidate: true });
                                    applyCorporateCategoryBenefits(value);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['A', 'B', 'C', 'D', 'E', 'F'].map((c) => (
                                        <SelectItem key={c} value={c}>
                                            Category {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={(errors as any).corporate_category_code?.message} />
                        </div>
                    )}

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="premium_amount">Premium payable</Label>
                            <Input id="premium_amount" type="number" step="0.01" {...register('premium_amount', { valueAsNumber: true } as any)} />
                            <InputError message={(errors as any).premium_amount?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="KES" />
                            <InputError message={(errors as any).currency?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" {...register('notes')} />
                        <InputError message={(errors as any).notes?.message} />
                    </div>

                    <div className="rounded border p-4 space-y-4">
                        <h3 className="text-sm font-medium">Members</h3>

                        {fields.map((field, index) => {
                            const member = currentMembers[index];
                            const isPrincipal = member?.is_principal;
                            const relationship = member?.relationship;
                            const memberSeq = typeof member?.member_sequence === 'number' ? member.member_sequence : index;

                            const showBirthCertificate = planType === 'junior' && relationship === 'child' && !isPrincipal;
                            const showIdNumber = !(showBirthCertificate);

                            return (
                                <div key={field.id} className="rounded border p-3 space-y-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-medium">
                                            Member {memberSeq === 0 ? 'M' : `M+${memberSeq}`}
                                        </h4>
                                        {!isPrincipal && canAddAdditionalMembers && (
                                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Name</Label>
                                            <Input {...register(`members.${index}.name` as const)} />
                                            <InputError message={(errors as any)?.members?.[index]?.name?.message} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Date of Birth</Label>
                                            <Input type="date" {...register(`members.${index}.date_of_birth` as const)} />
                                            <InputError message={(errors as any)?.members?.[index]?.date_of_birth?.message} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Relationship</Label>
                                            <Select
                                                value={relationship}
                                                onValueChange={(value) => setValue(`members.${index}.relationship`, value as Relationship, { shouldValidate: true })}
                                                disabled={isPrincipal || (planType === 'junior' && !isPrincipal)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {relationshipOptions.map((r) => {
                                                        if (!isPrincipal && r === 'principal') return null;
                                                        return (
                                                            <SelectItem key={r} value={r}>
                                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={(errors as any)?.members?.[index]?.relationship?.message} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Phone Number</Label>
                                            <Input {...register(`members.${index}.phone` as const)} />
                                            <InputError message={(errors as any)?.members?.[index]?.phone?.message} />
                                        </div>
                                    </div>

                                    {showIdNumber && (
                                        <div className="grid gap-2">
                                            <Label>ID Number</Label>
                                            <Input {...register(`members.${index}.id_number` as const)} placeholder="e.g. 12345678" />
                                        </div>
                                    )}

                                    {showBirthCertificate && (
                                        <div className="grid gap-2">
                                            <Label>Birth Certificate Number</Label>
                                            <Input
                                                {...register(`members.${index}.birth_certificate_number` as const)}
                                                placeholder="e.g. BC-0001"
                                            />
                                        </div>
                                    )}

                                    {isPrincipal && (
                                        <div className="rounded border p-3 space-y-3">
                                            <h4 className="text-sm font-medium">Benefits</h4>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                {benefitTypes.map((bt) => {
                                                    if (!showMaternity && bt === 'maternity') return null;
                                                    if (planType === 'corporate' && !allowedBenefitsForCorporate.includes(bt)) return null;
                                                    const enabled = enabledBenefits.has(bt);
                                                    return (
                                                        <div key={bt} className="flex items-center justify-between gap-3 rounded border p-2">
                                                            <div>
                                                                <div className="text-sm font-medium">{benefitLabels[bt]}</div>
                                                                <div className="text-xs text-muted-foreground">Toggle cover</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={enabled}
                                                                    onChange={(e) => toggleBenefit(bt, e.target.checked)}
                                                                />
                                                                {enabled && (
                                                                    <div className="w-36">
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={principalBenefitsByType[bt] ?? 0}
                                                                            onChange={(e) => setBenefitAmount(bt, Number(e.target.value))}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hidden fields */}
                                    <input type="hidden" {...register(`members.${index}.member_sequence` as const, { valueAsNumber: true } as any)} />
                                    <input type="hidden" {...register(`members.${index}.is_principal` as const)} />
                                </div>
                            );
                        })}

                        {canAddAdditionalMembers && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    const nextSeq = Math.max(...currentMembers.map((m) => m.member_sequence)) + 1;
                                    append({
                                        member_sequence: nextSeq,
                                        is_principal: false,
                                        relationship: 'child',
                                        name: '',
                                        date_of_birth: '',
                                        phone: '',
                                        id_number: null,
                                        birth_certificate_number: null,
                                        benefits: [],
                                    });
                                }}
                            >
                                + Add member
                            </Button>
                        )}
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

