import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ClientSelector from '@/components/policies/ClientSelector';
import PolicyMemberManagement from '@/components/policies/PolicyMemberManagement';

const emptyToUndefined = (value: unknown) => {
    if (value === '' || value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
        return undefined;
    }
    return value;
};

const basePolicySchema = z.object({
    client_id: z.number().int().min(1, 'Client is required'),
    underwriter_id: z.number().int().min(1, 'Underwriter is required'),
    policy_type: z.enum(['motor', 'medical', 'wiba']),
    client_type: z.enum(['individual', 'corporate']),
    policy_number: z.string().trim().max(50).optional().or(z.literal('')),
    start_date: z.string().trim().min(1),
    end_date: z.string().trim().min(1),
    premium_amount: z.preprocess(
        emptyToUndefined,
        z.number({ message: 'Premium amount is required' }).nonnegative('Premium amount must be 0 or more'),
    ),
    currency: z.string().trim().max(3).default('KES'),
    notes: z.string().trim().max(5000).optional().or(z.literal('')),
    medical_category: z.enum(['A', 'B', 'C', 'D']).optional(),
    vehicle_use: z.enum(['private', 'commercial']).optional(),
    cover_type: z.enum(['third_party', 'comprehensive']).optional(),
    cover_plan: z.string().trim().max(100).optional(),
    cover_addons: z.array(z.enum(['comprehensive', 'excess', 'pvt'])).optional(),
    private_use_class: z.enum(['hire', 'chauffeur', 'taxi_hire', 'taxi_self_drive']).optional(),
    commercial_class: z.enum(['matatu', 'bus', 'truck', 'taxi', 'other']).optional(),
    capacity: z.preprocess(emptyToUndefined, z.number().positive().optional()),
    registration_number: z.string().trim().max(50).optional(),
    vehicle_make: z.string().trim().max(100).optional(),
    vehicle_model: z.string().trim().max(255).optional(),
    year_of_manufacture: z.preprocess(emptyToUndefined, z.number().int().min(1900).max(2100).optional()),
    vehicle_value: z.preprocess(emptyToUndefined, z.number().nonnegative().optional()),
    vehicle_color: z.string().trim().max(50).optional(),
    chassis_number: z.string().trim().max(100).optional(),
    engine_number: z.string().trim().max(100).optional(),
    carriage_capacity: z.preprocess(emptyToUndefined, z.number().positive().optional()),
    engine_size: z.string().trim().max(50).optional(),
    medical_benefits: z.array(z.enum(['inpatient', 'outpatient', 'optical', 'maternity'])).optional(),
});

type BasePolicyValues = z.infer<typeof basePolicySchema>;

type PolicyMember = {
    id: number;
    name: string;
    identifier?: string;
    relationship: string;
    phone?: string;
    id_number?: string;
    payroll_number?: string;
    annual_salary?: number;
};
type PolicyValues = BasePolicyValues;

type Client = { id: number; name: string; company_name?: string; type: string; phone: string; email: string; };
type Underwriter = { id: number; name: string };
type Props = {
    title: string;
    submitLabel: string;
    method: 'post';
    onCancelHref: string;
    initialValues?: Partial<PolicyValues>;
    underwriters: Underwriter[];
};

export default function ProgressivePolicyForm({
    title,
    submitLabel,
    onCancelHref,
    initialValues,
    underwriters,
}: Props) {
    const [showRiskNotePrompt, setShowRiskNotePrompt] = useState(false);
    const [members, setMembers] = useState<PolicyMember[]>([]);
    const [medicalBenefits, setMedicalBenefits] = useState<Array<'inpatient' | 'outpatient' | 'optical' | 'maternity'>>([]);
    const [createdPolicy, setCreatedPolicy] = useState<{ id: number; type: string } | null>(null);
    const [isCreatingRiskNote, setIsCreatingRiskNote] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        setValue,
        watch,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<PolicyValues>({
        resolver: zodResolver(basePolicySchema) as any,
        defaultValues: {
            client_id: initialValues?.client_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            client_type: 'individual',
            policy_type: (initialValues?.policy_type ?? 'motor') as PolicyValues['policy_type'],
            policy_number: initialValues?.policy_number ?? '',
            start_date: initialValues?.start_date ?? '',
            end_date: initialValues?.end_date ?? '',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            notes: initialValues?.notes ?? '',
            medical_category: initialValues?.medical_category,
            vehicle_use: initialValues?.vehicle_use,
            cover_type: initialValues?.cover_type,
            cover_plan: initialValues?.cover_plan,
            cover_addons: initialValues?.cover_addons ?? [],
            private_use_class: initialValues?.private_use_class,
            commercial_class: initialValues?.commercial_class,
            capacity: initialValues?.capacity,
            registration_number: initialValues?.registration_number,
            vehicle_make: initialValues?.vehicle_make,
            vehicle_model: initialValues?.vehicle_model,
            year_of_manufacture: initialValues?.year_of_manufacture,
            vehicle_value: initialValues?.vehicle_value,
            vehicle_color: initialValues?.vehicle_color,
            chassis_number: initialValues?.chassis_number,
            engine_number: initialValues?.engine_number,
            carriage_capacity: initialValues?.carriage_capacity,
            engine_size: initialValues?.engine_size,
            medical_benefits: initialValues?.medical_benefits ?? [],
        },
    });

    const watchedClientId = watch('client_id');
    const watchedUnderwriterId = watch('underwriter_id');
    const watchedPolicyType = watch('policy_type');
    const watchedVehicleUse = watch('vehicle_use');
    const watchedCoverType = watch('cover_type');
    const watchedCoverAddons = watch('cover_addons') ?? [];
    const watchedClientType = watch('client_type');

    const extractFirstErrorMessage = (errorBag: FieldErrors<PolicyValues>): string | null => {
        const visited = new WeakSet<object>();

        const walk = (value: unknown): string | null => {
            if (!value || typeof value !== 'object') {
                return null;
            }
            if (visited.has(value)) {
                return null;
            }
            visited.add(value);

            if ('message' in value && typeof (value as { message?: unknown }).message === 'string') {
                return (value as { message: string }).message;
            }

            if (Array.isArray(value)) {
                for (const item of value) {
                    const found = walk(item);
                    if (found) {
                        return found;
                    }
                }
                return null;
            }

            for (const [key, nested] of Object.entries(value)) {
                if (key === 'ref' || key === 'types' || key === 'root') {
                    continue;
                }
                const found = walk(nested);
                if (found) {
                    return found;
                }
            }

            return null;
        };

        return walk(errorBag);
    };

    const submit = async (values: PolicyValues) => {
        setSubmitError(null);

        if (values.policy_type === 'motor') {
            if (!values.vehicle_use) {
                setError('vehicle_use', { message: 'Vehicle use is required for motor policies.' });
                return;
            }
            if (!values.cover_type) {
                setError('cover_type', { message: 'Cover type is required for motor policies.' });
                return;
            }
            if (values.vehicle_use === 'private' && values.cover_type === 'third_party' && !values.cover_plan) {
                setError('cover_plan', { message: 'Please select a third party option.' });
                return;
            }
            if (values.vehicle_use === 'private' && values.cover_type === 'comprehensive' && (!values.cover_addons || values.cover_addons.length === 0)) {
                setError('cover_addons', { message: 'Please select at least one comprehensive option.' });
                return;
            }
            if (values.vehicle_use === 'commercial' && !values.cover_plan) {
                setError('cover_plan', { message: 'Please select a commercial cover option.' });
                return;
            }
            if (!values.registration_number?.trim()) {
                setError('registration_number', { message: 'Registration number is required for motor policies.' });
                return;
            }
            if (values.vehicle_value === undefined || values.vehicle_value === null || Number.isNaN(values.vehicle_value)) {
                setError('vehicle_value', { message: 'Vehicle value is required for motor policies.' });
                return;
            }
            if (!values.vehicle_color?.trim()) {
                setError('vehicle_color', { message: 'Vehicle color is required for motor policies.' });
                return;
            }
            if (!values.chassis_number?.trim()) {
                setError('chassis_number', { message: 'Chassis number is required for motor policies.' });
                return;
            }
        }

        if (
            values.client_type === 'corporate'
            && (values.policy_type === 'medical' || values.policy_type === 'wiba')
        ) {
            if (members.length === 0) {
                setSubmitError('Please add at least one employee before creating this policy.');
                return;
            }

            const hasInvalidEmployee = members.some((member) =>
                !member.name
                || !member.relationship
                || !member.id_number
                || !member.payroll_number
                || !member.phone
                || member.annual_salary === undefined,
            );
            if (hasInvalidEmployee) {
                setSubmitError('Please complete all employee fields: Name, Relationship, ID Number, Payroll Number, Phone, and Annual Salary.');
                return;
            }
        }

        const payload = {
            ...values,
            policy_number: values.policy_number || null,
            capacity_unit: values.cover_type === 'comprehensive' ? 'cc' : null,
            members,
            medical_benefits: medicalBenefits,
        };

        try {
            const response = await fetch('/policies/progressive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorPayload: Record<string, any> = {};
                try {
                    errorPayload = await response.json();
                } catch {
                    setSubmitError('Could not process your request. Please refresh and try again.');
                    return;
                }

                const serverErrors = errorPayload.errors ?? {};
                const firstError = Object.values(serverErrors)[0];
                if (firstError) {
                    setSubmitError(Array.isArray(firstError) ? String(firstError[0]) : String(firstError));
                }

                Object.entries(serverErrors).forEach(([key, messages]) => {
                    const messageText = Array.isArray(messages) ? String(messages[0]) : String(messages);
                    setError(key as keyof PolicyValues, { message: messageText });
                });
                return;
            }

            const data = await response.json();
            setCreatedPolicy({ id: data.policy_id, type: data.policy_type });
            setShowRiskNotePrompt(true);
        } catch {
            setSubmitError('Network error while creating policy. Please check your connection and retry.');
        }
    };

    const onInvalidSubmit = (formErrors: FieldErrors<PolicyValues>) => {
        const firstMessage = extractFirstErrorMessage(formErrors);
        setSubmitError(firstMessage ?? 'Please complete all required fields before creating the policy.');
    };

    const handleClientSelect = (client: Client) => {
        setValue('client_id', client.id, { shouldValidate: true });
        setValue('client_type', client.type as 'individual' | 'corporate', { shouldValidate: true });
    };

    const handleCreateRiskNote = async () => {
        setShowRiskNotePrompt(false);
        if (!createdPolicy) {
            router.visit('/policies');
            return;
        }

        setIsCreatingRiskNote(true);
        try {
            const response = await fetch(`/policies/${createdPolicy.id}/risk-note`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });

            if (!response.ok) {
                router.visit('/policies');
                return;
            }

            const data = await response.json();
            if (data.url) {
                router.visit(data.url);
                return;
            }
            router.visit('/policies');
        } finally {
            setIsCreatingRiskNote(false);
        }
    };

    const handleSkipRiskNote = () => {
        setShowRiskNotePrompt(false);
        router.visit('/policies');
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit(submit as any, onInvalidSubmit)} className="space-y-6" noValidate>
                        <div className="space-y-4">
                            <ClientSelector onClientSelect={handleClientSelect} />
                            <InputError message={errors.client_id?.message} />
                        </div>

                        {watchedClientId > 0 && (
                            <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Underwriter</Label>
                                        <Select
                                            value={watchedUnderwriterId ? String(watchedUnderwriterId) : ''}
                                            onValueChange={(value) => setValue('underwriter_id', Number(value), { shouldValidate: true })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select underwriter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {underwriters.map((uw) => (
                                                    <SelectItem key={uw.id} value={String(uw.id)}>
                                                        {uw.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.underwriter_id?.message} />
                                    </div>
                                    <div>
                                        <Label>Policy Type</Label>
                                        <Select
                                            value={watchedPolicyType}
                                            onValueChange={(value) => setValue('policy_type', value as PolicyValues['policy_type'], { shouldValidate: true })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select policy type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="motor">Motor</SelectItem>
                                                <SelectItem value="medical">Medical</SelectItem>
                                                <SelectItem value="wiba">WIBA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.policy_type?.message} />
                                    </div>
                                    <div>
                                        <Label htmlFor="policy_number">Policy Number (Optional)</Label>
                                        <Input
                                            id="policy_number"
                                            placeholder="Filled when insurer issues number"
                                            {...register('policy_number')}
                                        />
                                        <InputError message={errors.policy_number?.message} />
                                    </div>
                                    <div>
                                        <Label htmlFor="start_date">Start Date</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            {...register('start_date')}
                                        />
                                        <InputError message={errors.start_date?.message} />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_date">End Date</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            {...register('end_date')}
                                        />
                                        <InputError message={errors.end_date?.message} />
                                    </div>
                                    <div>
                                        <Label htmlFor="premium_amount">Premium Amount</Label>
                                        <Input
                                            id="premium_amount"
                                            type="number"
                                            step="0.01"
                                            {...register('premium_amount', { valueAsNumber: true })}
                                        />
                                        <InputError message={errors.premium_amount?.message} />
                                    </div>
                                </div>

                                {watchedPolicyType === 'medical' && (
                                    watchedClientType === 'corporate' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Medical Category</Label>
                                                <Select onValueChange={(value) => setValue('medical_category', value as 'A' | 'B' | 'C' | 'D', { shouldValidate: true })}>
                                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A">A</SelectItem>
                                                        <SelectItem value="B">B</SelectItem>
                                                        <SelectItem value="C">C</SelectItem>
                                                        <SelectItem value="D">D</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.medical_category?.message} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Benefits</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { key: 'inpatient', label: 'Inpatient' },
                                                        { key: 'outpatient', label: 'Outpatient' },
                                                        { key: 'optical', label: 'Optical' },
                                                        { key: 'maternity', label: 'Maternity' },
                                                    ].map((benefit) => (
                                                        <label key={benefit.key} className="flex items-center gap-2 rounded border p-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={medicalBenefits.includes(benefit.key as 'inpatient' | 'outpatient' | 'optical' | 'maternity')}
                                                                onChange={(e) => {
                                                                    const key = benefit.key as 'inpatient' | 'outpatient' | 'optical' | 'maternity';
                                                                    const next = e.target.checked
                                                                        ? [...medicalBenefits, key]
                                                                        : medicalBenefits.filter((x) => x !== key);
                                                                    setMedicalBenefits(next);
                                                                    setValue('medical_benefits', next, { shouldValidate: true });
                                                                }}
                                                            />
                                                            <span>{benefit.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null
                                )}

                                {watchedPolicyType === 'motor' && (
                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label>Vehicle Use</Label>
                                                <Select
                                                    value={watchedVehicleUse ?? ''}
                                                    onValueChange={(value) => {
                                                        setValue('vehicle_use', value as 'private' | 'commercial', { shouldValidate: true });
                                                        setValue('cover_plan', '', { shouldValidate: true });
                                                        setValue('cover_addons', [], { shouldValidate: true });
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select vehicle use" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="private">Private</SelectItem>
                                                        <SelectItem value="commercial">Commercial</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.vehicle_use?.message} />
                                            </div>
                                            <div>
                                                <Label>Cover Type</Label>
                                                <Select
                                                    value={watchedCoverType ?? ''}
                                                    onValueChange={(value) => {
                                                        setValue('cover_type', value as 'third_party' | 'comprehensive', { shouldValidate: true });
                                                        setValue('cover_plan', '', { shouldValidate: true });
                                                        setValue('cover_addons', [], { shouldValidate: true });
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select cover type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="third_party">Third Party</SelectItem>
                                                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.cover_type?.message} />
                                            </div>
                                        </div>
                                        {watchedVehicleUse === 'private' && watchedCoverType === 'third_party' && (
                                            <div>
                                                <Label>Third Party Option</Label>
                                                <Select
                                                    value={watch('cover_plan') ?? ''}
                                                    onValueChange={(value) => setValue('cover_plan', value, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select third party option" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="third_party_only">Third Party Only</SelectItem>
                                                        <SelectItem value="third_party_and_fire">Third Party and Fire</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.cover_plan?.message} />
                                            </div>
                                        )}
                                        {watchedVehicleUse === 'private' && watchedCoverType === 'comprehensive' && (
                                            <div>
                                                <Label>Comprehensive Options</Label>
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                    {[
                                                        { key: 'comprehensive', label: 'Comprehensive' },
                                                        { key: 'excess', label: 'Excess' },
                                                        { key: 'pvt', label: 'PVT' },
                                                    ].map((addon) => (
                                                        <label key={addon.key} className="flex items-center gap-2 rounded border p-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={watchedCoverAddons.includes(addon.key as 'comprehensive' | 'excess' | 'pvt')}
                                                                onChange={(e) => {
                                                                    const key = addon.key as 'comprehensive' | 'excess' | 'pvt';
                                                                    const next = e.target.checked
                                                                        ? [...watchedCoverAddons, key]
                                                                        : watchedCoverAddons.filter((x) => x !== key);
                                                                    setValue('cover_addons', next, { shouldValidate: true });
                                                                }}
                                                            />
                                                            <span>{addon.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <InputError message={errors.cover_addons?.message as string | undefined} />
                                            </div>
                                        )}
                                        {watchedVehicleUse === 'commercial' && watchedCoverType === 'third_party' && (
                                            <div>
                                                <Label>Third Party Option</Label>
                                                <Select
                                                    value={watch('cover_plan') ?? ''}
                                                    onValueChange={(value) => setValue('cover_plan', value, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select commercial third party option" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="third_party_psv">Third Party PSV</SelectItem>
                                                        <SelectItem value="third_party_matatu">Third Party Matatu</SelectItem>
                                                        <SelectItem value="third_party_general_cartag">Third Party General Cartag</SelectItem>
                                                        <SelectItem value="third_party_own_goods">Third Party Own Goods</SelectItem>
                                                        <SelectItem value="third_party_bus">Third Party Bus</SelectItem>
                                                        <SelectItem value="third_party_heavy_trucks">Third Party Heavy Trucks</SelectItem>
                                                        <SelectItem value="third_party_school_bus">Third Party School Bus</SelectItem>
                                                        <SelectItem value="third_party_ambulance">Third Party Ambulance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.cover_plan?.message} />
                                            </div>
                                        )}
                                        {watchedVehicleUse === 'commercial' && watchedCoverType === 'comprehensive' && (
                                            <div>
                                                <Label>Comprehensive Option</Label>
                                                <Select
                                                    value={watch('cover_plan') ?? ''}
                                                    onValueChange={(value) => setValue('cover_plan', value, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select commercial comprehensive option" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="comprehensive_psv">Comprehensive PSV</SelectItem>
                                                        <SelectItem value="comprehensive_matatu">Comprehensive Matatu</SelectItem>
                                                        <SelectItem value="comprehensive_general_cartag">Comprehensive General Cartag</SelectItem>
                                                        <SelectItem value="comprehensive_own_goods">Comprehensive Own Goods</SelectItem>
                                                        <SelectItem value="comprehensive_bus">Comprehensive Bus</SelectItem>
                                                        <SelectItem value="comprehensive_heavy_trucks">Comprehensive Heavy Trucks</SelectItem>
                                                        <SelectItem value="comprehensive_school_bus">Comprehensive School Bus</SelectItem>
                                                        <SelectItem value="comprehensive_ambulance">Comprehensive Ambulance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.cover_plan?.message} />
                                            </div>
                                        )}
                                        {watchedCoverType === 'comprehensive' && (
                                            <div>
                                                <Label htmlFor="capacity">Capacity (cc)</Label>
                                                <Input id="capacity" type="number" step="0.01" {...register('capacity', { valueAsNumber: true })} />
                                                <InputError message={errors.capacity?.message} />
                                            </div>
                                        )}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="registration_number">Registration Number</Label>
                                                <Input id="registration_number" placeholder="e.g. KDA 123A" {...register('registration_number')} />
                                                <InputError message={errors.registration_number?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="vehicle_value">Vehicle Value</Label>
                                                <Input id="vehicle_value" type="number" step="0.01" {...register('vehicle_value', { valueAsNumber: true })} />
                                                <InputError message={errors.vehicle_value?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="vehicle_make">Vehicle Make</Label>
                                                <Input id="vehicle_make" placeholder="e.g. Toyota" {...register('vehicle_make')} />
                                                <InputError message={errors.vehicle_make?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                                                <Input id="vehicle_model" placeholder="e.g. Toyota Axio" {...register('vehicle_model')} />
                                                <InputError message={errors.vehicle_model?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="year_of_manufacture">Year of Manufacture</Label>
                                                <Input id="year_of_manufacture" type="number" {...register('year_of_manufacture', { valueAsNumber: true })} />
                                                <InputError message={errors.year_of_manufacture?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="vehicle_color">Vehicle Color</Label>
                                                <Input id="vehicle_color" placeholder="e.g. White" {...register('vehicle_color')} />
                                                <InputError message={errors.vehicle_color?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="chassis_number">Chassis Number</Label>
                                                <Input id="chassis_number" placeholder="Enter chassis number" {...register('chassis_number')} />
                                                <InputError message={errors.chassis_number?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="engine_number">Engine Number</Label>
                                                <Input id="engine_number" placeholder="Enter engine number" {...register('engine_number')} />
                                                <InputError message={errors.engine_number?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="carriage_capacity">Carriage Capacity</Label>
                                                <Input id="carriage_capacity" type="number" step="0.01" {...register('carriage_capacity', { valueAsNumber: true })} />
                                                <InputError message={errors.carriage_capacity?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="engine_size">Engine Size</Label>
                                                <Input id="engine_size" placeholder="e.g. 1500cc" {...register('engine_size')} />
                                                <InputError message={errors.engine_size?.message} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        rows={3}
                                        placeholder="Additional policy notes..."
                                        {...register('notes')}
                                    />
                                    <InputError message={errors.notes?.message} />
                                </div>

                                {(watchedPolicyType === 'medical' || watchedPolicyType === 'wiba') && (
                                    <PolicyMemberManagement
                                        members={members}
                                        onMembersChange={setMembers}
                                        policyType={watchedPolicyType}
                                        clientType={watchedClientType}
                                    />
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="outline" onClick={() => router.visit(onCancelHref)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || watchedClientId <= 0}>
                                {isSubmitting ? 'Saving...' : submitLabel}
                            </Button>
                        </div>
                        <InputError message={submitError ?? undefined} />
                    </form>
                </CardContent>
            </Card>

            {showRiskNotePrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Create Risk Note?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                Create Risk Note from these details now?
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={handleSkipRiskNote}
                                disabled={isCreatingRiskNote}
                            >
                                No, Later
                            </Button>
                            <Button onClick={handleCreateRiskNote} disabled={isCreatingRiskNote}>
                                {isCreatingRiskNote ? 'Creating...' : 'Yes, Create Risk Note'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </>
    );
}
