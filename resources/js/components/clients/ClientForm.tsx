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

export const clientSchema = z
    .object({
        type: z.enum(['individual', 'corporate']),
        name: z.string().trim().max(255),
        company_name: z.string().trim().max(255),
        id_number: z.string().trim().max(50),
        registration_number: z.string().trim().max(50),
        kra_pin: z.string().trim().max(50),
        phone: z.string().trim().max(50),
        email: z.string().trim().email(),
        address: z.string().trim().max(1000),
        notes: z.string().trim().max(2000).optional().or(z.literal('')),
    })
    .superRefine((values, ctx) => {
        const isIndividual = values.type === 'individual';

        if (isIndividual) {
            if (!values.name) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['name'],
                    message: 'Name is required for individual clients.',
                });
            }

            if (!values.id_number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['id_number'],
                    message: 'ID Number is required for individual clients.',
                });
            }
        }

        if (!isIndividual) {
            if (!values.company_name) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['company_name'],
                    message: 'Company name is required for corporate clients.',
                });
            }

            if (!values.registration_number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['registration_number'],
                    message: 'Registration number is required for corporate clients.',
                });
            }
        }

        if (!values.kra_pin) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['kra_pin'],
                message: 'KRA PIN is required.',
            });
        }

        if (!values.phone) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['phone'],
                message: 'Phone is required.',
            });
        }

        if (!values.address) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['address'],
                message: 'Address is required.',
            });
        }
    });

export type ClientFormValues = z.infer<typeof clientSchema>;

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    initialValues?: Partial<ClientFormValues> & {
        id_number?: string | null;
        registration_number?: string | null;
        notes?: string | null;
        kra_pin?: string | null;
    };
    onCancelHref: string;
};

export default function ClientForm({
    title,
    submitLabel,
    method,
    submitUrl,
    initialValues,
    onCancelHref,
}: Props) {
    const {
        register,
        setValue,
        watch,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            type: initialValues?.type ?? 'individual',
            name: initialValues?.name ?? '',
            company_name: initialValues?.company_name ?? '',
            id_number: initialValues?.id_number ?? '',
            registration_number:
                initialValues?.registration_number ?? '',
            kra_pin: initialValues?.kra_pin ?? '',
            phone: initialValues?.phone ?? '',
            email: initialValues?.email ?? '',
            address: initialValues?.address ?? '',
            notes: initialValues?.notes ?? '',
        },
    });

    const type = watch('type');

    const submit = (values: ClientFormValues) => {
        const payload = {
            ...values,
            // Keep backend expectations simple: transform empty strings to null.
            kra_pin: values.kra_pin || null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            // Laravel returns an errors object keyed by field name.
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof ClientFormValues, {
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
                <form
                    onSubmit={handleSubmit(submit)}
                    className="space-y-6"
                    noValidate
                >
                    <div className="grid gap-2">
                        <Label htmlFor="type">Client type</Label>
                        <Select
                            value={type}
                            onValueChange={(value) =>
                                setValue('type', value as ClientFormValues['type'], {
                                    shouldValidate: true,
                                })
                            }
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="individual">
                                    Individual
                                </SelectItem>
                                <SelectItem value="corporate">
                                    Corporate
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type?.message} />
                    </div>

                    {type === 'individual' ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. John Doe"
                                    {...register('name')}
                                />
                                <InputError message={errors.name?.message} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="id_number">ID number</Label>
                                <Input
                                    id="id_number"
                                    placeholder="e.g. Passport number / National ID"
                                    {...register('id_number')}
                                />
                                <InputError message={errors.id_number?.message} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="company_name">Company name</Label>
                                <Input
                                    id="company_name"
                                    placeholder="e.g. ACME Holdings Ltd."
                                    {...register('company_name')}
                                />
                                <InputError
                                    message={errors.company_name?.message}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="registration_number">
                                    Registration number
                                </Label>
                                <Input
                                    id="registration_number"
                                    placeholder="e.g. RC / Incorporation number"
                                    {...register('registration_number')}
                                />
                                <InputError
                                    message={errors.registration_number?.message}
                                />
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="kra_pin">KRA PIN</Label>
                        <Input
                            id="kra_pin"
                            placeholder="e.g. ABC1234567"
                            {...register('kra_pin')}
                        />
                        <InputError message={errors.kra_pin?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            placeholder="e.g. +254..."
                            {...register('phone')}
                        />
                        <InputError message={errors.phone?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="e.g. name@company.com"
                            {...register('email')}
                        />
                        <InputError message={errors.email?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            placeholder="Street / City / Country"
                            {...register('address')}
                        />
                        <InputError message={errors.address?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Internal notes about the client"
                            {...register('notes')}
                        />
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

