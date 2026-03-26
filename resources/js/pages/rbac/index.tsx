import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { BreadcrumbItem } from '@/types';

type RoleDto = {
    name: string;
    permissions: string[];
};

type Props = {
    roles: RoleDto[];
    permissions: string[];
    selectedRoleName?: string | null;
};

export default function RolesPermissions({
    roles,
    permissions,
    selectedRoleName,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Roles & Permissions', href: '/roles-permissions' },
    ];

    const initialRoleName = useMemo(() => {
        if (selectedRoleName) return selectedRoleName;
        return (
            roles.find((r) => r.name === 'admin')?.name ??
            roles[0]?.name ??
            ''
        );
    }, [roles, selectedRoleName]);

    const [activeRoleName, setActiveRoleName] = useState<string>(initialRoleName);

    useEffect(() => {
        // Keep state consistent if roles change due to a successful create action.
        setActiveRoleName(initialRoleName);
    }, [initialRoleName]);

    const activeRole = roles.find((r) => r.name === activeRoleName);

    const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(
        () => new Set(activeRole?.permissions ?? []),
    );

    useEffect(() => {
        setCheckedPermissions(new Set(activeRole?.permissions ?? []));
    }, [activeRoleName, activeRole?.permissions]);

    const [roleCreateName, setRoleCreateName] = useState('');
    const [roleCreateError, setRoleCreateError] = useState<string | null>(null);

    const [permissionCreateName, setPermissionCreateName] = useState('');
    const [permissionCreateError, setPermissionCreateError] = useState<string | null>(null);

    const togglePermission = (permissionName: string) => {
        setCheckedPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(permissionName)) next.delete(permissionName);
            else next.add(permissionName);
            return next;
        });
    };

    const saveRolePermissions = () => {
        if (!activeRoleName) return;

        router.put(
            `/roles-permissions/roles/${encodeURIComponent(activeRoleName)}/permissions`,
            { permissions: Array.from(checkedPermissions) },
            { preserveScroll: true },
        );
    };

    const createRole = () => {
        setRoleCreateError(null);
        router.post('/roles-permissions/roles', { name: roleCreateName }, {
            preserveScroll: true,
            onError: (errs) => {
                const maybe = (errs as Record<string, unknown>)?.name;
                if (maybe) setRoleCreateError(String(maybe));
            },
        });
    };

    const createPermission = () => {
        setPermissionCreateError(null);
        router.post('/roles-permissions/permissions', { name: permissionCreateName }, {
            preserveScroll: true,
            onError: (errs) => {
                const maybe = (errs as Record<string, unknown>)?.name;
                if (maybe) setPermissionCreateError(String(maybe));
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & Permissions" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Roles & Permissions"
                    description="Create roles and manage which permissions each role can access."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create role</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-2">
                                <Label htmlFor="new_role">Role name</Label>
                                <Input
                                    id="new_role"
                                    value={roleCreateName}
                                    onChange={(e) => setRoleCreateName(e.target.value)}
                                    placeholder="e.g. claims_officer"
                                />
                                <InputError message={roleCreateError ?? undefined} />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setRoleCreateName('')}
                                >
                                    Clear
                                </Button>
                                <Button type="button" onClick={createRole}>
                                    Create role
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Create permission</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-2">
                                <Label htmlFor="new_permission">Permission name</Label>
                                <Input
                                    id="new_permission"
                                    value={permissionCreateName}
                                    onChange={(e) => setPermissionCreateName(e.target.value)}
                                    placeholder="e.g. clients.export"
                                />
                                <InputError message={permissionCreateError ?? undefined} />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setPermissionCreateName('')}
                                >
                                    Clear
                                </Button>
                                <Button type="button" onClick={createPermission}>
                                    Create permission
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Assign permissions to role</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select
                                value={activeRoleName}
                                onValueChange={(v) => setActiveRoleName(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.name} value={role.name}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-medium">Permissions</h3>
                                <Button type="button" size="sm" onClick={saveRolePermissions}>
                                    Save
                                </Button>
                            </div>

                            <div className="max-h-[420px] overflow-y-auto pr-2">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {permissions.map((permissionName) => {
                                        const checked = checkedPermissions.has(permissionName);

                                        return (
                                            <label
                                                key={permissionName}
                                                className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5"
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() =>
                                                        togglePermission(permissionName)
                                                    }
                                                />
                                                <span className="truncate text-sm">
                                                    {permissionName}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

