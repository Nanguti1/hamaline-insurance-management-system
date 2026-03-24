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

        $admin = Role::findOrCreate('admin', 'web');
        $underwriter = Role::findOrCreate('underwriter', 'web');
        $claimsOfficer = Role::findOrCreate('claims_officer', 'web');
        $financeOfficer = Role::findOrCreate('finance_officer', 'web');
        $client = Role::findOrCreate('client', 'web');

        $admin->syncPermissions(Permission::all());

        $underwriter->syncPermissions([
            'quotations.view', 'quotations.manage',
            'policies.view', 'policies.manage',
        ]);

        $claimsOfficer->syncPermissions([
            'claims.view', 'claims.manage',
        ]);

        $financeOfficer->syncPermissions([
            'payments.view', 'payments.manage',
            'commissions.view', 'commissions.manage',
        ]);

        $client->syncPermissions([
            'policies.view',
            'claims.view',
            'payments.view',
        ]);

        User::query()->orderBy('id')->first()?->assignRole('admin');
    }
}
