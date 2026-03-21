<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'clients.view', 'clients.manage',
            'underwriters.view', 'underwriters.manage',
            'quotations.view', 'quotations.manage',
            'policies.view', 'policies.manage',
            'payments.view', 'payments.manage',
            'claims.view', 'claims.manage',
            'commissions.view', 'commissions.manage',
            'renewals.view', 'renewals.manage',
            'reports.view', 'reports.manage',
            'communications.send',
            'users.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $admin = Role::findOrCreate('Admin', 'web');
        $agent = Role::findOrCreate('Agent', 'web');
        $claimsOfficer = Role::findOrCreate('Claims Officer', 'web');

        $admin->syncPermissions(Permission::all());

        $agent->syncPermissions([
            'clients.view', 'clients.manage',
            'underwriters.view',
            'quotations.view', 'quotations.manage',
            'policies.view', 'policies.manage',
            'payments.view', 'payments.manage',
            'claims.view',
            'commissions.view', 'commissions.manage',
            'renewals.view', 'renewals.manage',
            'reports.view',
            'communications.send',
        ]);

        $claimsOfficer->syncPermissions([
            'clients.view',
            'policies.view',
            'claims.view', 'claims.manage',
            'reports.view',
            'communications.send',
        ]);

        User::query()->orderBy('id')->first()?->assignRole('Admin');
    }
}
