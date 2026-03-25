import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const wibaRiskNoteSchema = z
    .object({
        client_id: z.coerce.number().int().min(1),
        underwriter_id: z.coerce.number().int().min(1),
        notes: z.string().trim().max(2000).optional().or(z.literal('')),
        employees: z
            .array(
                z.object({
                    employee_sequence: z.coerce.number().int().min(0),
                    name: z.string().trim().min(1).max(255),
                    payroll_number: z.string().trim().min(1).max(50),
                    id_number: z.string().trim().min(1).max(50),
                    date_of_birth: z.string().trim().min(1),
                    annual_salary: z.coerce.number().min(0),
                }),
            )
            .min(1),
    })
    .strict();

type WibaRiskNoteFormValues = z.infer<typeof wibaRiskNoteSchema>;

type Props = {
    title: string;
    submitLabel: string;
    submitUrl: string;
    onCancelHref: string;
    clients: Array<{ id: number; name?: string | null; company_name?: string | null }>;
    underwriters: Array<{ id: number; name?: string | null }>;
    initialValues?: Partial<WibaRiskNoteFormValues>;
};

export default function WibaRiskNoteForm({ title, submitLabel, submitUrl, onCancelHref, clients, underwriters, initialValues }: Props) {
    const schemaResolver = zodResolver(wibaRiskNoteSchema) as any;

    const { register, setValue, handleSubmit, control, formState: { errors, isSubmitting }, setError, watch } =
        useForm<WibaRiskNoteFormValues>({
            resolver: schemaResolver,
            defaultValues: {
                client_id: initialValues?.client_id ?? 0,
                underwriter_id: initialValues?.underwriter_id ?? 0,
                notes: initialValues?.notes ?? '',
                employees:
                    initialValues?.employees ?? [
                        {
                            employee_sequence: 0,
                            name: '',
                            payroll_number: '',
                            id_number: '',
                            date_of_birth: '',
                            annual_salary: 0,
                        },
                    ],
            },
        });

    const { fields, append, remove } = useFieldArray({ control, name: 'employees' });
    const employees = watch('employees');

    const nextSequence = useMemo(() => {
        const seqs = employees.map((e) => e.employee_sequence ?? 0);
        return Math.max(...seqs) + 1;
    }, [employees]);

    const submit = (values: WibaRiskNoteFormValues) => {
        const payload = {
            ...values,
            notes: values.notes ? values.notes : null,
            // Only the validated keys are used by the backend service.
        };

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
                                    <SelectValue placeholder="Select corporate client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.company_name ?? c.name ?? 'Client'}
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

                    <div className="space-y-4 rounded border p-4">
                        <h3 className="text-sm font-medium">Employees</h3>
                        <div className="space-y-4">
                            {fields.map((field, idx) => (
                                <div key={field.id} className="rounded border p-3 space-y-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-medium">Employee {idx === 0 ? '' : `#${idx}`}</h4>
                                        {idx > 0 && (
                                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Name</Label>
                                            <Input {...register(`employees.${idx}.name` as const)} />
                                            <InputError message={(errors as any)?.employees?.[idx]?.name?.message} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Payroll Number</Label>
                                            <Input {...register(`employees.${idx}.payroll_number` as const)} />
                                            <InputError message={(errors as any)?.employees?.[idx]?.payroll_number?.message} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>ID Number</Label>
                                            <Input {...register(`employees.${idx}.id_number` as const)} />
                                            <InputError message={(errors as any)?.employees?.[idx]?.id_number?.message} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Date of Birth</Label>
                                            <Input type="date" {...register(`employees.${idx}.date_of_birth` as const)} />
                                            <InputError message={(errors as any)?.employees?.[idx]?.date_of_birth?.message} />
                                        </div>
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label>Annual Salary</Label>
                                            <Input type="number" step="0.01" {...register(`employees.${idx}.annual_salary` as const, { valueAsNumber: true } as any)} />
                                            <InputError message={(errors as any)?.employees?.[idx]?.annual_salary?.message} />
                                        </div>
                                    </div>

                                    <input type="hidden" {...register(`employees.${idx}.employee_sequence` as const, { valueAsNumber: true } as any)} />
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                append({
                                    employee_sequence: nextSequence,
                                    name: '',
                                    payroll_number: '',
                                    id_number: '',
                                    date_of_birth: '',
                                    annual_salary: 0,
                                });
                            }}
                        >
                            + Add employee
                        </Button>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Input id="notes" {...register('notes')} />
                        <InputError message={(errors as any)?.notes?.message} />
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

