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

export const underwriterSchema = z.object({
    name: z.string().trim().min(1).max(255),
    phone: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(255),
    address: z.string().trim().max(2000).optional().or(z.literal('')),
    notes: z.string().trim().max(5000).optional().or(z.literal('')),
});

export type UnderwriterFormValues = z.infer<typeof underwriterSchema>;

type Props = {
    title: string;
    submitLabel: string;
    method: 'post' | 'put';
    submitUrl: string;
    initialValues?: Partial<UnderwriterFormValues> & {
        address?: string | null;
        notes?: string | null;
    };
    onCancelHref: string;
};

export default function UnderwriterForm({
    title,
    submitLabel,
    method,
    submitUrl,
    initialValues,
    onCancelHref,
}: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<UnderwriterFormValues>({
        resolver: zodResolver(underwriterSchema),
        defaultValues: {
            name: initialValues?.name ?? '',
            phone: initialValues?.phone ?? '',
            email: initialValues?.email ?? '',
            address: initialValues?.address ?? '',
            notes: initialValues?.notes ?? '',
        },
    });

    const submit = (values: UnderwriterFormValues) => {
        const payload = {
            ...values,
            address: values.address ? values.address : null,
            notes: values.notes ? values.notes : null,
        };

        const onError = (serverErrors: Record<string, unknown>) => {
            Object.entries(serverErrors).forEach(([key, message]) => {
                setError(key as keyof UnderwriterFormValues, {
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
                <form
                    onSubmit={handleSubmit(submit)}
                    className="space-y-6"
                    noValidate
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register('name')} placeholder="Underwriter name" />
                        <InputError message={errors.name?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register('phone')} placeholder="e.g. +254..." />
                        <InputError message={errors.phone?.message} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="email@company.com" />
                        <InputError message={errors.email?.message} />
                    </div>

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

