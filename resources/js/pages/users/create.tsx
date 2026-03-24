import { Head, router } from '@inertiajs/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: 'New user', href: '/users/create' },
];

const schema = z
    .object({
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(255),
        password_confirmation: z.string().min(8).max(255),
        role: z.enum(['admin', 'underwriter', 'claims_officer', 'finance_officer', 'client']),
        client_id: z.coerce.number().int().positive().optional().nullable(),
        is_active: z.boolean(),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    })
    .superRefine((d, ctx) => {
        if (d.role === 'client' && !d.client_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Select a client record to link',
                path: ['client_id'],
            });
        }
    });

type FormValues = z.infer<typeof schema>;

type ClientOpt = { id: number; label: string };
type RoleOpt = { value: string; label: string };

type Props = {
    roles: RoleOpt[];
    clients: ClientOpt[];
};

export default function UsersCreate({ roles, clients }: Props) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: 'underwriter',
            client_id: null,
            is_active: true,
        },
    });

    const role = watch('role');
    const clientId = watch('client_id');
    const isActive = watch('is_active');

    const onSubmit = (values: FormValues) => {
        const payload: Record<string, unknown> = {
            name: values.name,
            email: values.email,
            password: values.password,
            password_confirmation: values.password_confirmation,
            role: values.role,
            is_active: values.is_active,
        };
        if (values.role === 'client' && values.client_id) {
            payload.client_id = values.client_id;
        }

        router.post('/users', payload, {
            preserveScroll: true,
            onError: (errs) => {
                Object.entries(errs).forEach(([k, v]) =>
                    setError(k as keyof FormValues, { message: String(v) }),
                );
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New user" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="New user" description="Create a staff or client login" />

                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Account details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" {...register('name')} autoComplete="name" />
                                <InputError message={errors.name?.message} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" {...register('email')} autoComplete="email" />
                                <InputError message={errors.email?.message} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" {...register('password')} autoComplete="new-password" />
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
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select
                                    value={role}
                                    onValueChange={(v) => setValue('role', v as FormValues['role'], { shouldValidate: true })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem key={r.value} value={r.value}>
                                                {r.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.role?.message} />
                            </div>
                            {role === 'client' && (
                                <div className="grid gap-2">
                                    <Label>Linked client</Label>
                                    <Select
                                        value={clientId ? String(clientId) : ''}
                                        onValueChange={(v) =>
                                            setValue('client_id', v ? Number(v) : null, { shouldValidate: true })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client record" />
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
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    className="size-4 rounded border"
                                    checked={isActive}
                                    onChange={(e) => setValue('is_active', e.target.checked)}
                                />
                                <Label htmlFor="is_active" className="font-normal">
                                    Active (can sign in)
                                </Label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => router.visit('/users')}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving…' : 'Create user'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
