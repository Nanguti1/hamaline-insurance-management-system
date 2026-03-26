<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesPermissionsController extends Controller
{
    private const GUARD_NAME = 'web';

    public function index(Request $request): Response
    {
        $roles = Role::query()
            ->where('guard_name', self::GUARD_NAME)
            ->with('permissions')
            ->orderBy('name')
            ->get();

        $permissions = Permission::query()
            ->where('guard_name', self::GUARD_NAME)
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();

        $rolesData = $roles->map(fn (Role $role) => [
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name')->values()->all(),
        ])->values()->all();

        $selectedRoleName = $request->query('role');
        if (! is_string($selectedRoleName) || $selectedRoleName === '') {
            $selectedRoleName = $rolesData[0]['name'] ?? null;
        }

        $roleNames = array_column($rolesData, 'name');
        if ($selectedRoleName && ! in_array($selectedRoleName, $roleNames, true)) {
            $selectedRoleName = $rolesData[0]['name'] ?? null;
        }

        return Inertia::render('rbac/index', [
            'roles' => $rolesData,
            'permissions' => $permissions,
            'selectedRoleName' => $selectedRoleName,
        ]);
    }

    public function createRole(Request $request): RedirectResponse
    {
        $rawName = $request->input('name');
        $name = $this->normalizeName($rawName);

        Validator::make(['name' => $name], [
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
        ])->validate();

        Role::findOrCreate($name, self::GUARD_NAME);

        return to_route('roles-permissions.index');
    }

    public function createPermission(Request $request): RedirectResponse
    {
        $rawName = $request->input('name');
        $name = $this->normalizeName($rawName);

        Validator::make(['name' => $name], [
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_\\.]+$/'],
        ])->validate();

        Permission::findOrCreate($name, self::GUARD_NAME);

        return to_route('roles-permissions.index');
    }

    public function syncRolePermissions(Request $request, string $role): RedirectResponse
    {
        $roleModel = Role::query()
            ->where('guard_name', self::GUARD_NAME)
            ->where('name', $role)
            ->firstOrFail();

        $permissions = $request->input('permissions', []);
        if (! is_array($permissions)) {
            $permissions = [];
        }

        $allowedPermissions = Permission::query()
            ->where('guard_name', self::GUARD_NAME)
            ->pluck('name')
            ->values()
            ->all();

        Validator::make(['permissions' => $permissions], [
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in($allowedPermissions)],
        ])->validate();

        $roleModel->syncPermissions($permissions);

        return to_route('roles-permissions.index', ['role' => $roleModel->name]);
    }

    private function normalizeName(null|string $name): string
    {
        $normalized = strtolower(trim((string) $name));
        $normalized = preg_replace('/\s+/', '_', $normalized) ?? '';
        $normalized = preg_replace('/[^a-z0-9_\\.]/', '', $normalized) ?? '';

        return trim((string) $normalized);
    }
}

