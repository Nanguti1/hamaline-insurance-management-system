<?php

namespace Tests\Feature\Rbac;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_open_users_module(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $this->actingAs($user)->get('/users')->assertOk();
    }

    public function test_underwriter_cannot_open_users_module(): void
    {
        $user = User::factory()->create();
        $user->assignRole('underwriter');

        $this->actingAs($user)->get('/users')->assertForbidden();
    }

    public function test_underwriter_cannot_open_payments(): void
    {
        $user = User::factory()->create();
        $user->assignRole('underwriter');

        $this->actingAs($user)->get('/payments')->assertForbidden();
    }

    public function test_claims_officer_cannot_open_policies(): void
    {
        $user = User::factory()->create();
        $user->assignRole('claims_officer');

        $this->actingAs($user)->get('/policies')->assertForbidden();
    }

    public function test_finance_officer_cannot_open_claims(): void
    {
        $user = User::factory()->create();
        $user->assignRole('finance_officer');

        $this->actingAs($user)->get('/claims')->assertForbidden();
    }

    public function test_underwriter_can_open_quotations(): void
    {
        $user = User::factory()->create();
        $user->assignRole('underwriter');

        $this->actingAs($user)->get('/quotations')->assertOk();
    }

    public function test_finance_officer_can_open_commissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('finance_officer');

        $this->actingAs($user)->get('/commissions')->assertOk();
    }
}
