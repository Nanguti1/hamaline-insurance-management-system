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

const mainSchema = z
    .object({
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(255),
        role: z.enum(['admin', 'underwriter', 'claims_officer', 'finance_officer', 'client']),
        client_id: z.coerce.number().int().positive().optional().nullable(),
        is_active: z.boolean(),
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

type MainFormValues = z.infer<typeof mainSchema>;

const pwSchema = z
    .object({
        password: z.string().min(8).max(255),
        password_confirmation: z.string().min(8).max(255),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

type PwFormValues = z.infer<typeof pwSchema>;

type ClientOpt = { id: number; label: string };
type RoleOpt = { value: string; label: string };

type Props = {
    user: {
        id: number;
        name: string;
        email: string;
        is_active: boolean;
        role: string | null;
        client_id: number | null;
    };
    roles: RoleOpt[];
    clients: ClientOpt[];
};

export default function UsersEdit({ user, roles, clients }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        { title: user.name, href: `/users/${user.id}/edit` },
    ];

    const mainForm = useForm<MainFormValues>({
        resolver: zodResolver(mainSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            role: (user.role as MainFormValues['role']) ?? 'underwriter',
            client_id: user.client_id,
            is_active: user.is_active,
        },
    });

    const pwForm = useForm<PwFormValues>({
        resolver: zodResolver(pwSchema),
        defaultValues: { password: '', password_confirmation: '' },
    });

    const role = mainForm.watch('role');
    const clientId = mainForm.watch('client_id');
    const isActive = mainForm.watch('is_active');

    const onSaveProfile = (values: MainFormValues) => {
        const payload: Record<string, unknown> = {
            name: values.name,
            email: values.email,
            role: values.role,
            is_active: values.is_active,
        };
        if (values.role === 'client') {
            payload.client_id = values.client_id;
        }

        router.put(`/users/${user.id}`, payload, {
            preserveScroll: true,
            onError: (errs) => {
                Object.entries(errs).forEach(([k, v]) =>
                    mainForm.setError(k as keyof MainFormValues, { message: String(v) }),
                );
            },
        });
    };

    const onResetPassword = (values: PwFormValues) => {
        router.post(
            `/users/${user.id}/password`,
            {
                password: values.password,
                password_confirmation: values.password_confirmation,
            },
            {
                preserveScroll: true,
                onSuccess: () => pwForm.reset(),
                onError: (errs) => {
                    Object.entries(errs).forEach(([k, v]) =>
                        pwForm.setError(k as keyof PwFormValues, { message: String(v) }),
                    );
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Edit user" description="Update role, status, and linked client" />

                <div className="grid max-w-xl gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={mainForm.handleSubmit(onSaveProfile)} className="space-y-4" noValidate>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" {...mainForm.register('name')} />
                                    <InputError message={mainForm.formState.errors.name?.message} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...mainForm.register('email')} />
                                    <InputError message={mainForm.formState.errors.email?.message} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={role}
                                        onValueChange={(v) =>
                                            mainForm.setValue('role', v as MainFormValues['role'], {
                                                shouldValidate: true,
                                            })
                                        }
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
                                    <InputError message={mainForm.formState.errors.role?.message} />
                                </div>
                                {role === 'client' && (
                                    <div className="grid gap-2">
                                        <Label>Linked client</Label>
                                        <Select
                                            value={clientId ? String(clientId) : ''}
                                            onValueChange={(v) =>
                                                mainForm.setValue('client_id', v ? Number(v) : null, {
                                                    shouldValidate: true,
                                                })
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
                                        <InputError message={mainForm.formState.errors.client_id?.message} />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        className="size-4 rounded border"
                                        checked={isActive}
                                        onChange={(e) => mainForm.setValue('is_active', e.target.checked)}
                                    />
                                    <Label htmlFor="is_active" className="font-normal">
                                        Active (can sign in)
                                    </Label>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => router.visit('/users')}>
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={mainForm.formState.isSubmitting}>
                                        {mainForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Reset password</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={pwForm.handleSubmit(onResetPassword)} className="space-y-4" noValidate>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">New password</Label>
                                    <Input id="password" type="password" {...pwForm.register('password')} />
                                    <InputError message={pwForm.formState.errors.password?.message} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        {...pwForm.register('password_confirmation')}
                                    />
                                    <InputError message={pwForm.formState.errors.password_confirmation?.message} />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" variant="secondary" disabled={pwForm.formState.isSubmitting}>
                                        {pwForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
