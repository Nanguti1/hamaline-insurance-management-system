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
            'medical_risks.view', 'medical_risks.manage',
            'medical_risks.underwrite', 'medical_risks.cancel',
            'motor_risks.view', 'motor_risks.manage',
            'motor_risks.underwrite', 'motor_risks.cancel',
            'wiba_risks.view', 'wiba_risks.manage',
            'wiba_risks.underwrite', 'wiba_risks.cancel',
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
            'medical_risks.view',
            'medical_risks.underwrite',
            'medical_risks.cancel',
            'motor_risks.view',
            'motor_risks.underwrite',
            'motor_risks.cancel',
            'wiba_risks.view',
            'wiba_risks.underwrite',
            'wiba_risks.cancel',
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
            'medical_risks.view',
            'motor_risks.view',
            'wiba_risks.view',
        ]);

        $firstUser = User::query()->orderBy('id')->first();
        if ($firstUser instanceof User) {
            $firstUser->assignRole('admin');
        }
    }
}
