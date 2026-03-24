<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        // User::factory(10)->create();

        $user = User::firstOrCreate([
            'email' => 'g.nanguti@gmail.com',
        ], [
            'name' => 'Wafula Wanyonyi',
            'password' => bcrypt('123123'),
        ]);

        if (! $user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
