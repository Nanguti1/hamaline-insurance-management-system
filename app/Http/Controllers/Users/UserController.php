<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ResetUserPasswordRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\Client;
use App\Models\User;
use App\Services\Users\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(
        private UserService $users,
    ) {}

    public function index(Request $request): Response
    {
        /** @var LengthAwarePaginator $paginator */
        $paginator = $this->users->paginate([
            'q' => $request->query('q'),
        ]);

        $paginator->getCollection()->transform(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'roles' => $user->getRoleNames()->values()->all(),
            ];
        });

        return Inertia::render('users/index', [
            'users' => $paginator,
            'filters' => [
                'q' => $request->query('q'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/create', [
            'roles' => $this->roleOptions(),
            'clients' => $this->clientOptions(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $user = $this->users->create($request->validated());

        return to_route('users.edit', $user)->with('success', 'User created.');
    }

    public function edit(User $user): Response
    {
        $user->load('roles');

        return Inertia::render('users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'role' => $user->getRoleNames()->first(),
                'client_id' => Client::query()->where('user_id', $user->id)->value('id'),
            ],
            'roles' => $this->roleOptions(),
            'clients' => $this->clientOptions($user),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->users->update($user, $request->validated());

        return back()->with('success', 'User updated.');
    }

    public function resetPassword(ResetUserPasswordRequest $request, User $user): RedirectResponse
    {
        $this->users->resetPassword($user, $request->validated('password'));

        return back()->with('success', 'Password updated.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            abort(403, 'You cannot delete your own account.');
        }

        $this->users->delete($user);

        return to_route('users.index')->with('success', 'User deleted.');
    }

    /**
     * @return list<array{id: int, label: string}>
     */
    private function clientOptions(?User $forUser = null): array
    {
        $query = Client::query()
            ->where(function ($q) use ($forUser) {
                $q->whereNull('user_id');
                if ($forUser) {
                    $q->orWhere('user_id', $forUser->id);
                }
            })
            ->orderBy('name')
            ->orderBy('company_name');

        return $query->get()->map(fn (Client $c) => [
            'id' => $c->id,
            'label' => $c->display_name.' — '.$c->email,
        ])->values()->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function roleOptions(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'value' => $role->name,
                'label' => ucwords(str_replace('_', ' ', $role->name)),
            ])
            ->values()
            ->all();
    }
}
