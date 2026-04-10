# Developer Onboarding Guide

This guide helps new and junior developers understand this codebase quickly and make safe maintenance or feature changes.

## 1) What This Project Is

This is a **Laravel monolith** with:
- **Inertia.js** for server-driven pages
- **React + TypeScript** for frontend UI
- **Spatie Permissions** for RBAC
- Domain modules for insurance operations (clients, policies, claims, payments, renewals, risk notes, reports)

High-level flow:
1. Request hits Laravel route.
2. Middleware/auth/permission checks run.
3. Controller validates input (FormRequest), calls service logic.
4. Service updates models and database.
5. Controller returns `Inertia::render(...)` or redirect.
6. React page receives props and renders UI.

## 2) Important Folders

## Backend
- `app/Http/Controllers` - HTTP actions per module
- `app/Http/Requests` - validation rules for create/update flows
- `app/Services` - business logic and reusable domain operations
- `app/Models` - Eloquent models and relationships
- `app/Http/Middleware` - shared Inertia props, active-user checks
- `routes/web.php` - main route definitions and permission gates
- `database/migrations` - schema changes over time
- `database/seeders` - role/permission and bootstrap data

## Frontend
- `resources/js/pages` - Inertia page components by module
- `resources/js/components` - feature and shared UI components
- `resources/js/layouts` - app/auth/settings layouts
- `resources/js/lib` - utility helpers
- `resources/js/types` - shared TypeScript types
- `resources/js/app.tsx` - Inertia client boot

## 3) Core Domain Modules

Each module generally has:
- routes
- controller
- form requests
- service
- model(s)
- page + form components

Primary modules:
- Clients
- Underwriters
- Quotations
- Policies
- Payments
- Claims
- Renewals
- Reports
- Risk Notes (motor, medical, wiba)

For any module change, find these first:
1. `routes/web.php`
2. `app/Http/Controllers/<Module>/...`
3. `app/Http/Requests/<Module>/...`
4. `app/Services/<Module>/...`
5. `resources/js/pages/<module>/...`
6. `resources/js/components/<module>/...`

## 4) Request and Validation Flow

Typical write path:
1. Frontend submits with Inertia or fetch.
2. Controller action receives request.
3. FormRequest validates with `$request->validated()`.
4. Service performs business logic and persistence.
5. Redirect/JSON response returned.
6. Frontend shows flash messages / updates table state.

Keep validation in FormRequests and core logic in Services. Avoid putting heavy logic in controllers.

## 5) Auth and Permissions

- Route-level authorization is in `routes/web.php` using permission middleware.
- Role/permission management uses Spatie Permission.
- Record-level access/scoping is centralized in service access utilities (for example, resource access checks).
- Frontend navigation/UI visibility uses shared auth permissions from Inertia props.

When adding a protected feature:
1. Add/update permission name.
2. Gate route with permission middleware.
3. Enforce record-level access in service/controller.
4. Hide/show frontend menu/actions by permission.

## 6) Database and Migrations

Schema is migration-driven. New features often require:
- a migration
- model fillable/casts updates
- request validation updates
- service/controller mapping updates
- frontend form/page updates

### Production note (shared hosting)
If you cannot run `php artisan migrate`, prepare SQL patches from migrations and apply manually. Then insert migration names into the `migrations` table.

## 7) Frontend Patterns

- Pages live in `resources/js/pages/*`.
- Shared UI controls are in `resources/js/components/ui/*`.
- Forms use `react-hook-form` + zod in several places.
- Table/list pages use search/filter + index table + delete dialogs.
- Flash/toast style messages are handled from server flash and inline events.

For safe frontend changes:
1. Reuse existing components and page patterns.
2. Keep field names aligned with backend validation keys.
3. Preserve current layout and interaction flow unless explicitly changing UX.

## 8) Common Change Recipes

## Add a new field to an existing feature
1. Create migration.
2. Update model (`fillable`, `casts`).
3. Update FormRequest rules/messages.
4. Update service/controller mapping.
5. Update frontend form and page display.
6. Verify create/edit/show/index flows.

## Add dependent dropdowns
1. Keep source values in one place in form component.
2. Reset dependent fields when parent selection changes.
3. Add backend conditional validation (`required_if` or branching rules).
4. Persist only valid combinations.

## Add delete behavior with smooth UI update
1. Use shared delete helper.
2. Preserve scroll.
3. Reload/refresh current page state after success.
4. Show success feedback (flash/toast).

## 9) Debugging Checklist

If a feature fails:
1. Check browser network response body for validation errors.
2. Check FormRequest rules and field names.
3. Check controller/service payload mapping.
4. Check model fillable/casts.
5. Check database column existence/types.
6. Check permission middleware and access checks.

If UI renders but data missing:
1. Verify controller `Inertia::render` props.
2. Verify page component prop types and field names.
3. Verify relationships are loaded (`->load(...)`).

## 10) Safe Maintenance Guidelines

- Do not remove existing flows unless requested.
- Prefer additive changes over rewrites.
- Keep route names stable.
- Keep backend and frontend field names synchronized.
- Avoid mixing unrelated refactors with feature fixes.
- Add migration files for schema changes; do not edit old migrations in active projects.

## 11) Useful Starting Points

- App routing and permissions: `routes/web.php`
- Inertia shared props: `app/Http/Middleware/HandleInertiaRequests.php`
- App boot: `resources/js/app.tsx`
- Sidebar and navigation permissions: `resources/js/components/app-sidebar.tsx`
- Policy progressive flow (example of complex form): `resources/js/components/policies/ProgressivePolicyForm.tsx`

## 12) First Tasks for a New Dev

1. Run app locally and navigate each index page.
2. Pick one module (e.g. Policies) and trace end-to-end:
   - route -> controller -> request -> service -> model -> page/component
3. Make a tiny safe change (label/help text) and verify CI/lint/type checks.
4. Add one small field in dev branch to practice full-stack change flow.

---

If you are unsure where to implement logic, default rule:
- **Validation**: FormRequest
- **Business logic**: Service
- **Transport/wiring**: Controller
- **Display and interaction**: React page/components
