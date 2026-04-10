import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteResource } from '@/lib/delete-resource';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clients',
        href: '/clients',
    },
];

type ClientRow = {
    id: number;
    type: 'individual' | 'corporate';
    name?: string | null;
    company_name?: string | null;
    id_number?: string | null;
    registration_number?: string | null;
    phone?: string | null;
    email?: string | null;
};

type Props = {
    clients?: {
        data: ClientRow[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters?: {
        q?: string | null;
        type?: string | null;
        policy_type?: string | null;
        medical_category?: string | null;
        vehicle_use?: string | null;
        private_use_class?: string | null;
        commercial_class?: string | null;
    };
};

export default function ClientsIndex({ clients, filters }: Props) {
    const initialQ = filters?.q ?? '';
    const initialType = (filters?.type ?? '') as 'individual' | 'corporate' | '';
    const initialPolicyType = filters?.policy_type ?? '';
    const initialMedicalCategory = filters?.medical_category ?? '';
    const initialVehicleUse = filters?.vehicle_use ?? '';
    const initialPrivateUseClass = filters?.private_use_class ?? '';
    const initialCommercialClass = filters?.commercial_class ?? '';

    const [q, setQ] = useState<string>(initialQ);
    const [type, setType] = useState<'individual' | 'corporate' | ''>(initialType);
    const [policyType, setPolicyType] = useState<string>(initialPolicyType);
    const [medicalCategory, setMedicalCategory] = useState<string>(initialMedicalCategory);
    const [vehicleUse, setVehicleUse] = useState<string>(initialVehicleUse);
    const [privateUseClass, setPrivateUseClass] = useState<string>(initialPrivateUseClass);
    const [commercialClass, setCommercialClass] = useState<string>(initialCommercialClass);

    const emptyState = !clients || clients.data.length === 0;

    const pageTitle = useMemo(() => {
        if (!q && !type) return 'Clients';
        return `Clients • Filtered`;
    }, [q, type]);

    const doSearch = (e: FormEvent) => {
        e.preventDefault();

        router.get(
            '/clients',
            {
                q: q || undefined,
                type: type || undefined,
                policy_type: policyType || undefined,
                medical_category: medicalCategory || undefined,
                vehicle_use: vehicleUse || undefined,
                private_use_class: privateUseClass || undefined,
                commercial_class: commercialClass || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-background p-4">
                <Heading
                    title="Clients"
                    description="Manage individual and corporate clients"
                />
                <div className="flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/clients/create">+ Add Client</Link>
                    </Button>
                </div>

                <Card className="bg-surface/70">
                    <CardHeader className="space-y-1">
                        <h2 className="text-sm font-medium">Search</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            onSubmit={doSearch}
                            className="grid gap-4 md:grid-cols-3"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="q">Keyword</Label>
                                <Input
                                    id="q"
                                    placeholder="Name, email, ID..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={type || 'all'}
                                    onValueChange={(value) =>
                                        setType(value === 'all' ? '' : (value as 'individual' | 'corporate'))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All types
                                        </SelectItem>
                                        <SelectItem value="individual">
                                            Individual
                                        </SelectItem>
                                        <SelectItem value="corporate">
                                            Corporate
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dependent Filters */}
                            {type === 'corporate' && (
                                <div className="grid gap-2">
                                    <Label>Policy Type</Label>
                                    <Select
                                        value={policyType || 'all'}
                                        onValueChange={(value) =>
                                            setPolicyType(value === 'all' ? '' : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All policy types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="medical">Medical</SelectItem>
                                            <SelectItem value="motor">Motor</SelectItem>
                                            <SelectItem value="wiba">WIBA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {policyType === 'medical' && type === 'corporate' && (
                                <div className="grid gap-2">
                                    <Label>Medical Category</Label>
                                    <Select
                                        value={medicalCategory || 'all'}
                                        onValueChange={(value) =>
                                            setMedicalCategory(value === 'all' ? '' : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="A">Category A</SelectItem>
                                            <SelectItem value="B">Category B</SelectItem>
                                            <SelectItem value="C">Category C</SelectItem>
                                            <SelectItem value="D">Category D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {policyType === 'motor' && type === 'corporate' && (
                                <div className="grid gap-2">
                                    <Label>Vehicle Use</Label>
                                    <Select
                                        value={vehicleUse || 'all'}
                                        onValueChange={(value) =>
                                            setVehicleUse(value === 'all' ? '' : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All vehicle uses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="commercial">Commercial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {vehicleUse === 'private' && policyType === 'motor' && type === 'corporate' && (
                                <div className="grid gap-2">
                                    <Label>Private Use Class</Label>
                                    <Select
                                        value={privateUseClass || 'all'}
                                        onValueChange={(value) =>
                                            setPrivateUseClass(value === 'all' ? '' : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All classes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="hire">Hire</SelectItem>
                                            <SelectItem value="chauffeur">Chauffeur</SelectItem>
                                            <SelectItem value="taxi_hire">Taxi Hire</SelectItem>
                                            <SelectItem value="taxi_self_drive">Taxi Self Drive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {vehicleUse === 'commercial' && policyType === 'motor' && type === 'corporate' && (
                                <div className="grid gap-2">
                                    <Label>Commercial Class</Label>
                                    <Select
                                        value={commercialClass || 'all'}
                                        onValueChange={(value) =>
                                            setCommercialClass(value === 'all' ? '' : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All classes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="matatu">Matatu</SelectItem>
                                            <SelectItem value="bus">Bus</SelectItem>
                                            <SelectItem value="truck">Truck</SelectItem>
                                            <SelectItem value="taxi">Taxi</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                <Button type="submit">Search</Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setQ('');
                                        setType('');
                                        setPolicyType('');
                                        setMedicalCategory('');
                                        setVehicleUse('');
                                        setPrivateUseClass('');
                                        setCommercialClass('');
                                        router.get('/clients', {}, { replace: true });
                                    }}
                                >
                                    Reset filters
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {emptyState ? (
                    <Card>
                        <CardContent className="py-8 text-sm text-muted-foreground">
                            No clients found.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card className="border-primary/10 bg-white">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                                    <div className="text-sm text-muted-foreground">
                                        {clients?.data.length ?? 0} result(s)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href="/clients/create">
                                                + New Client
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>ID / Reg</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients?.data.map((client) => {
                                            const displayName =
                                                client.type === 'individual'
                                                    ? client.name
                                                    : client.company_name;
                                            const identifier =
                                                client.type === 'individual'
                                                    ? client.id_number
                                                    : client.registration_number;

                                            return (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">
                                                        {displayName ?? '-'}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {client.type}
                                                    </TableCell>
                                                    <TableCell>
                                                        {identifier ?? '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {client.phone ?? '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {client.email ?? '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/clients/${client.id}`}
                                                                >
                                                                    View
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link
                                                                    href={`/clients/${client.id}/edit`}
                                                                >
                                                                    Edit
                                                                </Link>
                                                            </Button>

                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogDescription>
                                                                            Are you sure you want to
                                                                            delete this client?
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <DialogClose asChild>
                                                                            <Button
                                                                                variant="secondary"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </DialogClose>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() =>
                                                                                deleteResource(
                                                                                    `/clients/${client.id}`,
                                                                                    'Client deleted successfully.',
                                                                                )
                                                                            }
                                                                        >
                                                                            Confirm delete
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {clients?.links && clients.links.length > 0 && (
                            <div className="flex items-center justify-center gap-2">
                                {clients.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={`${idx}-${link.label}`}
                                                className="px-2 py-2 text-sm text-muted-foreground"
                                            >
                                                {link.label}
                                            </span>
                                        );
                                    }

                                    return (
                                        <Button
                                            // eslint-disable-next-line react/no-array-index-key
                                            key={`${idx}-${link.label}`}
                                            asChild
                                            variant={
                                                link.active
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            size="sm"
                                        >
                                            <Link href={link.url}>
                                                {link.label}
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

