import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
const currentYear = new Date().getFullYear();

const basePolicySchema = z.object({
    client_id: z.coerce.number().int().min(1, 'Client is required'),
    insurer_id: z.coerce.number().int().min(1, 'Insurer is required'),
    underwriter_id: z.coerce.number().int().min(1, 'Underwriter is required'),
    binder_version_id: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
    policy_type: z.enum(['motor', 'medical', 'wiba']),
    client_type: z.enum(['individual', 'corporate']),
    policy_number: z.string().trim().max(50).optional().or(z.literal('')),
    start_date: z.string().trim().min(1),
    end_date: z.string().trim().min(1),
    premium_amount: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative('Premium amount must be 0 or more'),
    ),
    currency: z.string().trim().max(3).default('KES'),
    notes: z.string().trim().max(5000).optional().or(z.literal('')),
    medical_category: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).optional(),
    vehicle_use: z.enum(['private', 'commercial']).optional(),
    cover_type: z.enum(['third_party', 'comprehensive']).optional(),
    cover_plan: z.string().trim().max(100).optional(),
    cover_addons: z.array(z.enum(['comprehensive', 'excess', 'pvt'])).optional(),
    private_use_class: z.enum(['hire', 'chauffeur', 'taxi_hire', 'taxi_self_drive']).optional(),
    commercial_class: z.enum(['matatu', 'bus', 'truck', 'taxi', 'other']).optional(),
    capacity: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
    capacity_unit: z.enum(['cc', 'tons']).optional(),
    registration_number: z.string().trim().max(50).optional(),
    vehicle_make: z.string().trim().max(100).optional(),
    vehicle_model: z.string().trim().max(100).optional(),
    year_of_manufacture: z.preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1999).max(currentYear).optional()
    ),
    vehicle_value: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
    vehicle_color: z.string().trim().max(50).optional(),
    chassis_number: z.string().trim().max(50).optional(),
    engine_number: z.string().trim().max(50).optional(),
    carriage_capacity: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
    engine_size: z.string().trim().max(50).optional().or(z.literal('')),
    customer_id: z.string().trim().max(80).optional(),
    telephone_other: z.string().trim().max(50).optional(),
    postal_code: z.string().trim().max(20).optional(),
    country: z.string().trim().max(80).optional(),
    bank_account_number: z.string().trim().max(80).optional(),
    branch_code: z.string().trim().max(50).optional(),
    pin_number: z.string().trim().max(50).optional(),
    time_on_risk_start_date: z.string().trim().optional(),
    time_on_risk_end_date: z.string().trim().optional(),
    passenger_count: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    logbook_status: z.string().trim().max(50).optional(),
    accessories_value: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    windscreen_value: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    radio_value: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    applicable_clauses_text: z.string().trim().optional(),
    exclusions_text: z.string().trim().optional(),
    time_on_risk_premium: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    policyholders_fund: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    training_levy: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    first_premium_total: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    time_on_risk_total_premium: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    payment_method: z.string().trim().max(50).optional(),
    issuing_officer_name: z.string().trim().max(255).optional(),
    verifying_officer_name: z.string().trim().max(255).optional(),
    issued_on: z.string().trim().optional(),
    payment_plan_type: z.enum(['one_time', 'installments']).optional(),
    installment_count: z.preprocess(emptyToUndefined, z.coerce.number().int().min(2).max(10).optional()),
    installment_amount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    outpatient_benefit: z.boolean().optional(),
    outpatient_amount: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
    inpatient_benefit: z.boolean().optional(),
    inpatient_amount: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
    optical_benefit: z.boolean().optional(),
    optical_amount: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
    maternity_benefit: z.boolean().optional(),
    maternity_amount: z.preprocess(
        emptyToUndefined,
        z.coerce.number().nonnegative().optional()
    ),
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
type CoverPeriod = '1_month' | '3_months' | '6_months' | '1_year';

type Underwriter = { id: number; name: string };
type Insurer = { id: number; name: string };
type Props = {
    title: string;
    submitLabel: string;
    method: 'post';
    onCancelHref: string;
    initialValues?: Partial<PolicyValues>;
    underwriters: Underwriter[];
    insurers: Insurer[];
};

function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

function calculateEndDate(startDate: string, coverPeriod: CoverPeriod): string {
    if (!startDate) {
        return '';
    }

    const date = new Date(startDate);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    if (coverPeriod === '1_year') {
        date.setFullYear(date.getFullYear() + 1);
    } else {
        const monthsToAdd = coverPeriod === '1_month' ? 1 : coverPeriod === '3_months' ? 3 : 6;
        date.setMonth(date.getMonth() + monthsToAdd);
    }

    return date.toISOString().slice(0, 10);
}

export default function ProgressivePolicyForm({
    title,
    submitLabel,
    onCancelHref,
    initialValues,
    underwriters,
    insurers,
}: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showRiskNotePrompt, setShowRiskNotePrompt] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [createdPolicy, setCreatedPolicy] = useState<{ id: number; type: string } | null>(null);
    const [isCreatingRiskNote, setIsCreatingRiskNote] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [coverPeriod, setCoverPeriod] = useState<CoverPeriod>('1_year');
    const defaultStartDate = todayDateString();

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
            binder_version_id: initialValues?.binder_version_id,
            client_type: 'individual',
            policy_type: (initialValues?.policy_type ?? 'motor') as PolicyValues['policy_type'],
            policy_number: initialValues?.policy_number ?? '',
            start_date: initialValues?.start_date ?? defaultStartDate,
            end_date: initialValues?.end_date ?? calculateEndDate(defaultStartDate, '1_year'),
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
            customer_id: initialValues?.customer_id,
            telephone_other: initialValues?.telephone_other,
            postal_code: initialValues?.postal_code,
            country: initialValues?.country,
            bank_account_number: initialValues?.bank_account_number,
            branch_code: initialValues?.branch_code,
            pin_number: initialValues?.pin_number,
            time_on_risk_start_date: initialValues?.time_on_risk_start_date,
            time_on_risk_end_date: initialValues?.time_on_risk_end_date,
            passenger_count: initialValues?.passenger_count,
            logbook_status: initialValues?.logbook_status,
            accessories_value: initialValues?.accessories_value,
            windscreen_value: initialValues?.windscreen_value,
            radio_value: initialValues?.radio_value,
            applicable_clauses_text: initialValues?.applicable_clauses_text,
            exclusions_text: initialValues?.exclusions_text,
            time_on_risk_premium: initialValues?.time_on_risk_premium,
            policyholders_fund: initialValues?.policyholders_fund,
            training_levy: initialValues?.training_levy,
            first_premium_total: initialValues?.first_premium_total,
            time_on_risk_total_premium: initialValues?.time_on_risk_total_premium,
            payment_method: initialValues?.payment_method,
            issuing_officer_name: initialValues?.issuing_officer_name,
            verifying_officer_name: initialValues?.verifying_officer_name,
            issued_on: initialValues?.issued_on,
            payment_plan_type: initialValues?.payment_plan_type ?? 'one_time',
            installment_count: initialValues?.installment_count,
            installment_amount: initialValues?.installment_amount,
        },
    });

    const watchedClientId = watch('client_id');
    const watchedUnderwriterId = watch('underwriter_id');
    const watchedInsurerId = watch('insurer_id');
    const watchedPolicyType = watch('policy_type');
    const watchedVehicleUse = watch('vehicle_use');
    const watchedCoverType = watch('cover_type');
    const watchedCoverAddons = watch('cover_addons') ?? [];
    const watchedClientType = watch('client_type');
    const watchedStartDate = watch('start_date');
    const watchedPremiumAmount = watch('premium_amount');
    const watchedPaymentPlanType = watch('payment_plan_type');
    const watchedInstallmentCount = watch('installment_count');

    useEffect(() => {
        if (!watchedStartDate) {
            return;
        }

        const calculatedEndDate = calculateEndDate(watchedStartDate, coverPeriod);
        if (calculatedEndDate) {
            setValue('end_date', calculatedEndDate, { shouldValidate: true });
        }
    }, [coverPeriod, setValue, watchedStartDate]);

    useEffect(() => {
        const startDate = todayDateString();
        const calculatedEndDate = calculateEndDate(startDate, coverPeriod);
        setValue('start_date', startDate, { shouldValidate: true });
        setValue('end_date', calculatedEndDate, { shouldValidate: true });
    }, [coverPeriod, setValue]);

    useEffect(() => {
        if (watchedPaymentPlanType !== 'installments' || !watchedInstallmentCount || watchedInstallmentCount <= 0) {
            setValue('installment_amount', undefined, { shouldValidate: true });
            return;
        }

        const installmentAmount = Number((Number(watchedPremiumAmount || 0) / watchedInstallmentCount).toFixed(2));
        setValue('installment_amount', installmentAmount, { shouldValidate: true });
    }, [watchedInstallmentCount, watchedPaymentPlanType, watchedPremiumAmount, setValue]);

    useEffect(() => {
        const startDate = todayDateString();
        const calculatedEndDate = calculateEndDate(startDate, coverPeriod);
        setValue('start_date', startDate, { shouldValidate: true });
        setValue('end_date', calculatedEndDate, { shouldValidate: true });
    }, [coverPeriod, setValue]);

    useEffect(() => {
        const startDate = todayDateString();
        const calculatedEndDate = calculateEndDate(startDate, coverPeriod);
        setValue('start_date', startDate, { shouldValidate: true });
        setValue('end_date', calculatedEndDate, { shouldValidate: true });
    }, [coverPeriod, setValue]);

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
            installment_amount:
                values.payment_plan_type === 'installments' && values.installment_count
                    ? Number((Number(values.premium_amount || 0) / Number(values.installment_count)).toFixed(2))
                    : null,
            applicable_clauses: values.applicable_clauses_text
                ? values.applicable_clauses_text.split('\n').map((item) => item.trim()).filter(Boolean)
                : [],
            exclusions: values.exclusions_text
                ? values.exclusions_text.split('\n').map((item) => item.trim()).filter(Boolean)
                : [],
            members,
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

    const handleClientSelect = (client: any) => {
        setValue('client_id', client.id, { shouldValidate: true });
        setValue('client_type', client.type as 'individual' | 'corporate', { shouldValidate: true });
        setSelectedClient(client);
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
                                        <Label>Insurer</Label>
                                        <Select
                                            value={watchedInsurerId ? String(watchedInsurerId) : ''}
                                            onValueChange={(value) => setValue('insurer_id', Number(value), { shouldValidate: true })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select insurer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {insurers.map((insurer) => (
                                                    <SelectItem key={insurer.id} value={String(insurer.id)}>
                                                        {insurer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.insurer_id?.message} />
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
                                        <Label>Cover Period</Label>
                                        <Select
                                            value={coverPeriod}
                                            onValueChange={(value) => setCoverPeriod(value as CoverPeriod)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select cover period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1_month">1 month</SelectItem>
                                                <SelectItem value="3_months">3 months</SelectItem>
                                                <SelectItem value="6_months">6 months</SelectItem>
                                                <SelectItem value="1_year">1 year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="start_date">Start Date</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            readOnly
                                            {...register('start_date')}
                                        />
                                        <InputError message={errors.start_date?.message} />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_date">End Date</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            readOnly
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
                                                <Select onValueChange={(value) => setValue('medical_category', value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F', { shouldValidate: true })}>
                                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                                    <SelectContent>
                                                        {selectedClient?.medical_categories && selectedClient.medical_categories.length > 0 ? (
                                                            selectedClient.medical_categories.map((cat: any) => (
                                                                <SelectItem key={cat.category_code} value={cat.category_code}>
                                                                    {cat.category_code} ({cat.category_identifier ?? cat.category_name})
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="__none" disabled>
                                                                No categories configured for this client
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.medical_category?.message} />
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-medium mb-3">Medical Benefits</h4>
                                                <div className="space-y-3">
                                                    {/* Outpatient Benefit */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="outpatient_benefit"
                                                                {...register('outpatient_benefit')}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="outpatient_benefit" className="cursor-pointer">
                                                                Outpatient Benefit
                                                            </Label>
                                                        </div>
                                                        {watch('outpatient_benefit') && (
                                                            <div className="ml-6">
                                                                <Label htmlFor="outpatient_amount">Outpatient Amount</Label>
                                                                <Input
                                                                    id="outpatient_amount"
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="Enter amount"
                                                                    {...register('outpatient_amount', { valueAsNumber: true })}
                                                                />
                                                                <InputError message={errors.outpatient_amount?.message} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Inpatient Benefit */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="inpatient_benefit"
                                                                {...register('inpatient_benefit')}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="inpatient_benefit" className="cursor-pointer">
                                                                Inpatient Benefit
                                                            </Label>
                                                        </div>
                                                        {watch('inpatient_benefit') && (
                                                            <div className="ml-6">
                                                                <Label htmlFor="inpatient_amount">Inpatient Amount</Label>
                                                                <Input
                                                                    id="inpatient_amount"
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="Enter amount"
                                                                    {...register('inpatient_amount', { valueAsNumber: true })}
                                                                />
                                                                <InputError message={errors.inpatient_amount?.message} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Optical Benefit */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="optical_benefit"
                                                                {...register('optical_benefit')}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="optical_benefit" className="cursor-pointer">
                                                                Optical Benefit
                                                            </Label>
                                                        </div>
                                                        {watch('optical_benefit') && (
                                                            <div className="ml-6">
                                                                <Label htmlFor="optical_amount">Optical Amount</Label>
                                                                <Input
                                                                    id="optical_amount"
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="Enter amount"
                                                                    {...register('optical_amount', { valueAsNumber: true })}
                                                                />
                                                                <InputError message={errors.optical_amount?.message} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Maternity Benefit */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="maternity_benefit"
                                                                {...register('maternity_benefit')}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="maternity_benefit" className="cursor-pointer">
                                                                Maternity Benefit
                                                            </Label>
                                                        </div>
                                                        {watch('maternity_benefit') && (
                                                            <div className="ml-6">
                                                                <Label htmlFor="maternity_amount">Maternity Amount</Label>
                                                                <Input
                                                                    id="maternity_amount"
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="Enter amount"
                                                                    {...register('maternity_amount', { valueAsNumber: true })}
                                                                />
                                                                <InputError message={errors.maternity_amount?.message} />
                                                            </div>
                                                        )}
                                                    </div>
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
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="customer_id">Customer ID</Label>
                                                <Input id="customer_id" {...register('customer_id')} />
                                                <InputError message={errors.customer_id?.message} />
                                            </div>
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
                                            <div>
                                                <Label htmlFor="passenger_count">Passenger Count</Label>
                                                <Input id="passenger_count" type="number" {...register('passenger_count', { valueAsNumber: true })} />
                                                <InputError message={errors.passenger_count?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="logbook_status">Logbook Status</Label>
                                                <Input id="logbook_status" placeholder="e.g. COPY" {...register('logbook_status')} />
                                                <InputError message={errors.logbook_status?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="time_on_risk_start_date">Time on Risk Start</Label>
                                                <Input id="time_on_risk_start_date" type="date" {...register('time_on_risk_start_date')} />
                                                <InputError message={errors.time_on_risk_start_date?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="time_on_risk_end_date">Time on Risk End</Label>
                                                <Input id="time_on_risk_end_date" type="date" {...register('time_on_risk_end_date')} />
                                                <InputError message={errors.time_on_risk_end_date?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="policyholders_fund">Policyholders Fund</Label>
                                                <Input id="policyholders_fund" type="number" step="0.01" {...register('policyholders_fund', { valueAsNumber: true })} />
                                                <InputError message={errors.policyholders_fund?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="training_levy">Training Levy</Label>
                                                <Input id="training_levy" type="number" step="0.01" {...register('training_levy', { valueAsNumber: true })} />
                                                <InputError message={errors.training_levy?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="time_on_risk_premium">Time on Risk Premium</Label>
                                                <Input id="time_on_risk_premium" type="number" step="0.01" {...register('time_on_risk_premium', { valueAsNumber: true })} />
                                                <InputError message={errors.time_on_risk_premium?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="time_on_risk_total_premium">Time on Risk Total Premium</Label>
                                                <Input id="time_on_risk_total_premium" type="number" step="0.01" {...register('time_on_risk_total_premium', { valueAsNumber: true })} />
                                                <InputError message={errors.time_on_risk_total_premium?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="first_premium_total">First Premium Total</Label>
                                                <Input id="first_premium_total" type="number" step="0.01" {...register('first_premium_total', { valueAsNumber: true })} />
                                                <InputError message={errors.first_premium_total?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="payment_method">Payment Method</Label>
                                                <Input id="payment_method" placeholder="e.g. CASH" {...register('payment_method')} />
                                                <InputError message={errors.payment_method?.message} />
                                            </div>
                                            <div>
                                                <Label>Payment Plan</Label>
                                                <Select
                                                    value={watch('payment_plan_type') ?? 'one_time'}
                                                    onValueChange={(value) => setValue('payment_plan_type', value as 'one_time' | 'installments', { shouldValidate: true })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="one_time">One Time Payment</SelectItem>
                                                        <SelectItem value="installments">Installments</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.payment_plan_type?.message} />
                                            </div>
                                            {watchedPaymentPlanType === 'installments' && (
                                                <>
                                                    <div>
                                                        <Label>Installment Count</Label>
                                                        <Select
                                                            value={String(watch('installment_count') ?? '')}
                                                            onValueChange={(value) => setValue('installment_count', Number(value), { shouldValidate: true })}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Select installments" /></SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 9 }, (_, i) => i + 2).map((count) => (
                                                                    <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError message={errors.installment_count?.message} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="installment_amount">Amount per Installment</Label>
                                                        <Input id="installment_amount" value={watch('installment_amount') ?? ''} readOnly />
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <Label htmlFor="issuing_officer_name">Issuing Officer</Label>
                                                <Input id="issuing_officer_name" {...register('issuing_officer_name')} />
                                                <InputError message={errors.issuing_officer_name?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="verifying_officer_name">Verifying Officer</Label>
                                                <Input id="verifying_officer_name" {...register('verifying_officer_name')} />
                                                <InputError message={errors.verifying_officer_name?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="issued_on">Issued On</Label>
                                                <Input id="issued_on" type="date" {...register('issued_on')} />
                                                <InputError message={errors.issued_on?.message} />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="applicable_clauses_text">Applicable Clauses (one per line)</Label>
                                                <Textarea id="applicable_clauses_text" rows={4} {...register('applicable_clauses_text')} />
                                                <InputError message={errors.applicable_clauses_text?.message} />
                                            </div>
                                            <div>
                                                <Label htmlFor="exclusions_text">Exclusions (one per line)</Label>
                                                <Textarea id="exclusions_text" rows={4} {...register('exclusions_text')} />
                                                <InputError message={errors.exclusions_text?.message} />
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
