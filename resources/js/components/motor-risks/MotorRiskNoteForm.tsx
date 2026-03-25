import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const motorRiskNoteSchema = z
    .object({
        client_id: z.coerce.number().int().min(1),
        underwriter_id: z.coerce.number().int().min(1),

        start_date: z.string().trim().min(1),
        end_date: z.string().trim().min(1),
        premium_amount: z.coerce.number().min(0),
        currency: z.string().trim().max(3).default('KES'),
        notes: z.string().trim().max(2000).optional().or(z.literal('')),

        insured_name: z.string().trim().min(1).max(255),
        insured_id_number: z.string().trim().min(1).max(50),
        insured_phone: z.string().trim().min(1).max(50),
        insured_email: z.string().trim().email().max(255),
        insured_postal_address: z.string().trim().min(1),

        registration_number: z.string().trim().min(1).max(50),
        make_model: z.string().trim().min(1).max(255),
        year_of_manufacture: z.coerce.number().int().min(1900).max(2100),
        chassis_number: z.string().trim().min(1).max(100),
        engine_number: z.string().trim().min(1).max(100),
        body_type: z.string().trim().min(1).max(50),
        vehicle_use: z.enum(['private', 'commercial']),

        cover_type: z.enum(['third_party_only', 'third_party_fire_theft', 'comprehensive']),
        sum_insured: z.coerce.number().min(0),
    })
    .strict();

type MotorRiskNoteFormValues = z.infer<typeof motorRiskNoteSchema>;

type SelectOption = { id: number; name?: string | null; company_name?: string | null };

type Props = {
    title: string;
    submitLabel: string;
    submitUrl: string;
    onCancelHref: string;
    clients: SelectOption[];
    underwriters: Array<{ id: number; name?: string | null }>;
    initialValues?: Partial<MotorRiskNoteFormValues>;
};

export default function MotorRiskNoteForm({ title, submitLabel, submitUrl, onCancelHref, clients, underwriters, initialValues }: Props) {
    const [coverType, setCoverType] = useState<MotorRiskNoteFormValues['cover_type']>(initialValues?.cover_type ?? 'comprehensive');
    const { register, setValue, handleSubmit, formState: { errors, isSubmitting }, setError, watch } = useForm<MotorRiskNoteFormValues>({
        resolver: zodResolver(motorRiskNoteSchema) as any,
        defaultValues: {
            client_id: initialValues?.client_id ?? 0,
            underwriter_id: initialValues?.underwriter_id ?? 0,
            start_date: initialValues?.start_date ?? '',
            end_date: initialValues?.end_date ?? '',
            premium_amount: initialValues?.premium_amount ?? 0,
            currency: initialValues?.currency ?? 'KES',
            notes: initialValues?.notes ?? '',

            insured_name: initialValues?.insured_name ?? '',
            insured_id_number: initialValues?.insured_id_number ?? '',
            insured_phone: initialValues?.insured_phone ?? '',
            insured_email: initialValues?.insured_email ?? '',
            insured_postal_address: initialValues?.insured_postal_address ?? '',

            registration_number: initialValues?.registration_number ?? '',
            make_model: initialValues?.make_model ?? '',
            year_of_manufacture: initialValues?.year_of_manufacture ?? new Date().getFullYear(),
            chassis_number: initialValues?.chassis_number ?? '',
            engine_number: initialValues?.engine_number ?? '',
            body_type: initialValues?.body_type ?? '',
            vehicle_use: initialValues?.vehicle_use ?? 'private',

            cover_type: initialValues?.cover_type ?? 'comprehensive',
            sum_insured: initialValues?.sum_insured ?? 0,
        },
    });

    const vehicleUse = watch('vehicle_use');

    const submit = (values: MotorRiskNoteFormValues) => {
        const payload = { ...values, notes: values.notes ? values.notes : null };
        router.post(submitUrl, payload, {
            preserveScroll: true,
            onError: (serverErrors) => {
                Object.entries(serverErrors).forEach(([key, message]) => setError(key as any, { message: String(message) }));
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
                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Client</Label>
                            <Select value={String(watch('client_id') || 0)} onValueChange={(v) => setValue('client_id', Number(v), { shouldValidate: true })}>
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
                            <InputError message={(errors as any)?.client_id?.message} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Underwriter</Label>
                            <Select value={String(watch('underwriter_id') || 0)} onValueChange={(v) => setValue('underwriter_id', Number(v), { shouldValidate: true })}>
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
                            <InputError message={(errors as any)?.underwriter_id?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="start_date">Start date</Label>
                            <Input id="start_date" type="date" {...register('start_date')} />
                            <InputError message={(errors as any)?.start_date?.message} />
                        </div>
                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="end_date">End date</Label>
                            <Input id="end_date" type="date" {...register('end_date')} />
                            <InputError message={(errors as any)?.end_date?.message} />
                        </div>
                        <div className="grid gap-2 md:col-span-1">
                            <Label htmlFor="premium_amount">Premium payable</Label>
                            <Input id="premium_amount" type="number" step="0.01" {...register('premium_amount', { valueAsNumber: true } as any)} />
                            <InputError message={(errors as any)?.premium_amount?.message} />
                        </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" {...register('currency')} placeholder="KES" />
                            <InputError message={(errors as any)?.currency?.message} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea id="notes" {...register('notes')} />
                            <InputError message={(errors as any)?.notes?.message} />
                        </div>
                    </div>

                    <div className="rounded border p-4 space-y-4">
                        <h4 className="text-sm font-medium">Insured</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input {...register('insured_name')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>ID/Passport Number</Label>
                                <Input {...register('insured_id_number')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input {...register('insured_phone')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input {...register('insured_email')} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Postal Address</Label>
                            <Input {...register('insured_postal_address')} />
                        </div>
                    </div>

                    <div className="rounded border p-4 space-y-4">
                        <h4 className="text-sm font-medium">Vehicle</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Registration Number</Label>
                                <Input {...register('registration_number')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Make & Model</Label>
                                <Input {...register('make_model')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Year of Manufacture</Label>
                                <Input type="number" {...register('year_of_manufacture', { valueAsNumber: true } as any)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Body Type</Label>
                                <Input {...register('body_type')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Chassis Number</Label>
                                <Input {...register('chassis_number')} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Engine Number</Label>
                                <Input {...register('engine_number')} />
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Use of Vehicle</Label>
                                <Select value={vehicleUse} onValueChange={(v) => setValue('vehicle_use', v as any, { shouldValidate: true })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Insurance Cover</Label>
                                <Select
                                    value={coverType}
                                    onValueChange={(v) => {
                                        setCoverType(v as any);
                                        setValue('cover_type', v as any, { shouldValidate: true });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="third_party_only">Third Party Only</SelectItem>
                                        <SelectItem value="third_party_fire_theft">Third Party Fire & Theft</SelectItem>
                                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Sum Insured</Label>
                                <Input type="number" step="0.01" {...register('sum_insured', { valueAsNumber: true } as any)} />
                            </div>
                        </div>
                    </div>

                    <CardFooter className="px-0">
                        <div className="flex w-full items-center justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={() => (window.location.href = onCancelHref)} disabled={isSubmitting}>
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

