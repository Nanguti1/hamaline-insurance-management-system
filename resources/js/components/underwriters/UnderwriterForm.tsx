import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const baseFields = {
    name: z.string().trim().min(1).max(255),
    phone: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(255),
    address: z.string().trim().max(2000).optional().or(z.literal('')),
    notes: z.string().trim().max(5000).optional().or(z.literal('')),
    insurer_ids: z.array(z.coerce.number().int()).min(1),
};

const createSchema = z
    .object({
        ...baseFields,
        password: z.string().min(8).max(255),
        password_confirmation: z.string().min(8).max(255),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

const editSchema = z
    .object({
        ...baseFields,
        password: z.string().max(255).optional().or(z.literal('')),
        password_confirmation: z.string().max(255).optional().or(z.literal('')),
    })
    .superRefine((data, ctx) => {
        const hasPw = Boolean(data.password && data.password.length > 0);
        const hasConf = Boolean(data.password_confirmation && data.password_confirmation.length > 0);
        if (hasPw !== hasConf) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Enter both password and confirmation',
                path: hasPw ? ['password_confirmation'] : ['password'],
            });
        }
        if (hasPw && data.password.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'At least 8 characters',
                path: ['password'],
            });
        }
        if (hasPw && data.password !== data.password_confirmation) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Passwords do not match',
                path: ['password_confirmation'],
            });
        }
    });

export type UnderwriterFormVariant = 'create' | 'edit';

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

type Props = {
    variant: UnderwriterFormVariant;
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    initialValues?: Partial<CreateValues> & {
        address?: string | null;
        notes?: string | null;
        insurer_ids?: number[] | null;
    };
    onCancelHref: string;
    insurers: Array<{ id: number; label: string }>;
};

export default function UnderwriterForm({
    variant,
    title,
    submitLabel,
    method,
    submitUrl,
    initialValues,
    onCancelHref,
    insurers,
}: Props) {
    const schema = variant === 'create' ? createSchema : editSchema;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<CreateValues | EditValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialValues?.name ?? '',
            phone: initialValues?.phone ?? '',
            email: initialValues?.email ?? '',
            address: initialValues?.address ?? '',
            notes: initialValues?.notes ?? '',
            insurer_ids: initialValues?.insurer_ids ?? [],
            password: '',
            password_confirmation: '',
        },
    });

    const selectedInsurerIds = watch('insurer_ids');

    const submit = (values: CreateValues | EditValues) => {
        const payload: Record<string, unknown> = {
            name: values.name,
            phone: values.phone,
            email: values.email,
            address: values.address ? values.address : null,
            notes: values.notes ? values.notes : null,
            insurer_ids: values.insurer_ids,
        };

        if (variant === 'create') {
            payload.password = (values as CreateValues).password;
            payload.password_confirmation = (values as CreateValues).password_confirmation;
        } else {
            const pw = (values as EditValues).password;
            if (pw) {
                payload.password = pw;
                payload.password_confirmation = (values as EditValues).password_confirmation;
            }
        }

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof CreateValues, {
                    message: String(message),
                });
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
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register('name')} placeholder="Underwriter name" autoComplete="name" />
                        <InputError message={errors.name?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register('phone')} placeholder="e.g. +254..." autoComplete="tel" />
                        <InputError message={errors.phone?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Login email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="email@company.com"
                            autoComplete="email"
                        />
                        <InputError message={errors.email?.message} />
                    </div>

                    {variant === 'create' ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password?.message} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    {...register('password_confirmation')}
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password_confirmation?.message} />
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Leave password fields blank to keep the current password.
                            </p>
                            <div className="grid gap-2">
                                <Label htmlFor="password">New password (optional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password?.message} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm new password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    {...register('password_confirmation')}
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password_confirmation?.message} />
                            </div>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address (optional)</Label>
                        <Textarea id="address" {...register('address')} placeholder="Office address" />
                        <InputError message={errors.address?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" {...register('notes')} placeholder="Internal notes" />
                        <InputError message={errors.notes?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Companies (insurers)</Label>
                        <div className="space-y-2">
                            {insurers.map((i) => {
                                const checked = selectedInsurerIds?.includes(i.id) ?? false;
                                return (
                                    <label key={i.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const next = e.target.checked
                                                    ? [...(selectedInsurerIds ?? []), i.id]
                                                    : (selectedInsurerIds ?? []).filter((x) => x !== i.id);
                                                setValue('insurer_ids', next, { shouldValidate: true });
                                            }}
                                        />
                                        <span className="text-sm">{i.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <InputError message={errors.insurer_ids?.message as string | undefined} />
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
