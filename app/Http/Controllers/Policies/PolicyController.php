<?php

namespace App\Http\Controllers\Policies;

use App\Http\Controllers\Controller;
use App\Http\Requests\Policies\ProgressivePolicyStoreRequest;
use App\Http\Requests\Policies\StorePolicyRequest;
use App\Http\Requests\Policies\UpdatePolicyRequest;
use App\Models\Client;
use App\Models\BinderVersion;
use App\Models\Insurer;
use App\Models\MedicalPolicyDetail;
use App\Models\MotorPolicyDetail;
use App\Models\Policy;
use App\Models\PolicyMember;
use App\Models\Quotation;
use App\Models\Underwriter;
use App\Models\WibaPolicyDetail;
use App\Services\Access\ResourceAccessService;
use App\Services\Policies\PolicyService;
use App\Services\RiskNotes\RiskNoteService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function index(Request $request, PolicyService $service): Response
    {
        $policies = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('policies/index', [
            'policies' => $policies,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('policies/create', [
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
            'quotations' => Quotation::query()
                ->orderBy('quotation_number')
                ->get([
                    'id',
                    'quotation_number',
                    'client_id',
                    'underwriter_id',
                    'insurer_id',
                    'premium_amount',
                    'currency',
                    'valid_until',
                    'policy_type',
                    'notes',
                ]),
        ]);
    }

    public function store(StorePolicyRequest $request, PolicyService $service): RedirectResponse
    {
        $policy = $service->create($request->validated());

        return to_route('policies.show', $policy)->with('success', 'Policy created successfully.');
    }

    public function progressiveStore(ProgressivePolicyStoreRequest $request, PolicyService $service): RedirectResponse|JsonResponse
    {
        $validated = $request->validated();

        // Create base policy
        $policyData = [
            'client_id' => $validated['client_id'],
            'underwriter_id' => $validated['underwriter_id'],
            'insurer_id' => $validated['insurer_id'],
            'policy_type' => $validated['policy_type'],
            'policy_number' => $validated['policy_number'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'premium_amount' => $validated['premium_amount'],
            'currency' => $validated['currency'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
            'created_by' => auth()->id(),
        ];

        $policy = Policy::create($policyData);

        switch ($validated['policy_type']) {
            case 'medical':
                if (! empty($validated['medical_category']) || ! empty($validated['outpatient_benefit']) || ! empty($validated['inpatient_benefit']) || ! empty($validated['optical_benefit']) || ! empty($validated['maternity_benefit'])) {
                    MedicalPolicyDetail::create([
                        'policy_id' => $policy->id,
                        'medical_category' => $validated['medical_category'] ?? null,
                        'outpatient_benefit' => $validated['outpatient_benefit'] ?? false,
                        'outpatient_amount' => $validated['outpatient_amount'] ?? null,
                        'inpatient_benefit' => $validated['inpatient_benefit'] ?? false,
                        'inpatient_amount' => $validated['inpatient_amount'] ?? null,
                        'optical_benefit' => $validated['optical_benefit'] ?? false,
                        'optical_amount' => $validated['optical_amount'] ?? null,
                        'maternity_benefit' => $validated['maternity_benefit'] ?? false,
                        'maternity_amount' => $validated['maternity_amount'] ?? null,
                        'notes' => $validated['notes'] ?? null,
                    ]);
                }
                break;

            case 'motor':
                $binderVersionId = $validated['binder_version_id'] ?? $this->resolveActiveMotorBinderVersionId(
                    (int) $validated['insurer_id']
                );
                $paymentPlanType = $validated['payment_plan_type'] ?? 'one_time';
                $installmentCount = $paymentPlanType === 'installments' ? (int) ($validated['installment_count'] ?? 0) : null;
                $installmentAmount = $paymentPlanType === 'installments' && $installmentCount
                    ? round(((float) $validated['premium_amount']) / $installmentCount, 2)
                    : null;

                MotorPolicyDetail::create([
                    'policy_id' => $policy->id,
                    'binder_version_id' => $binderVersionId,
                    'vehicle_use' => $validated['vehicle_use'],
                    'cover_type' => $validated['cover_type'],
                    'private_use_class' => $validated['private_use_class'] ?? null,
                    'commercial_class' => $validated['commercial_class'] ?? null,
                    'cover_plan' => $validated['cover_plan'] ?? null,
                    'cover_addons' => $validated['cover_addons'] ?? null,
                    'capacity' => $validated['capacity'] ?? null,
                    'capacity_unit' => $validated['capacity_unit'] ?? null,
                    'registration_number' => $validated['registration_number'] ?? null,
                    'vehicle_make' => $validated['vehicle_make'] ?? null,
                    'vehicle_model' => $validated['vehicle_model'] ?? null,
                    'year_of_manufacture' => $validated['year_of_manufacture'] ?? null,
                    'vehicle_value' => $validated['vehicle_value'] ?? null,
                    'vehicle_color' => $validated['vehicle_color'] ?? null,
                    'chassis_number' => $validated['chassis_number'] ?? null,
                    'engine_number' => $validated['engine_number'] ?? null,
                    'carriage_capacity' => $validated['carriage_capacity'] ?? null,
                    'engine_size' => $validated['engine_size'] ?? null,
                    'insurer_policy_number' => $policy->policy_number,
                    'internal_policy_number' => $this->generateInternalPolicyNumber($policy),
                    'customer_id' => $validated['customer_id'] ?? null,
                    'mobile_number' => null,
                    'telephone_other' => $validated['telephone_other'] ?? null,
                    'postal_code' => $validated['postal_code'] ?? null,
                    'country' => $validated['country'] ?? null,
                    'bank_account_number' => $validated['bank_account_number'] ?? null,
                    'branch_code' => $validated['branch_code'] ?? null,
                    'pin_number' => $validated['pin_number'] ?? null,
                    'time_on_risk_start_date' => $validated['time_on_risk_start_date'] ?? null,
                    'time_on_risk_end_date' => $validated['time_on_risk_end_date'] ?? null,
                    'passenger_count' => $validated['passenger_count'] ?? null,
                    'logbook_status' => $validated['logbook_status'] ?? null,
                    'accessories_value' => $validated['accessories_value'] ?? null,
                    'windscreen_value' => $validated['windscreen_value'] ?? null,
                    'radio_value' => $validated['radio_value'] ?? null,
                    'limits_liability' => $validated['limits_liability'] ?? null,
                    'excess_rules' => $validated['excess_rules'] ?? null,
                    'applicable_clauses' => $validated['applicable_clauses'] ?? null,
                    'exclusions' => $validated['exclusions'] ?? null,
                    'time_on_risk_premium' => $validated['time_on_risk_premium'] ?? null,
                    'policyholders_fund' => $validated['policyholders_fund'] ?? null,
                    'training_levy' => $validated['training_levy'] ?? null,
                    'first_premium_total' => $validated['first_premium_total'] ?? null,
                    'time_on_risk_total_premium' => $validated['time_on_risk_total_premium'] ?? null,
                    'payment_method' => $validated['payment_method'] ?? null,
                    'payment_plan_type' => $paymentPlanType,
                    'installment_count' => $installmentCount,
                    'installment_amount' => $installmentAmount,
                    'issuing_officer_name' => $validated['issuing_officer_name'] ?? null,
                    'verifying_officer_name' => $validated['verifying_officer_name'] ?? null,
                    'issued_on' => $validated['issued_on'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);
                break;

            case 'wiba':
                WibaPolicyDetail::create([
                    'policy_id' => $policy->id,
                    'notes' => $validated['notes'] ?? null,
                ]);
                break;
        }

        if (in_array($validated['policy_type'], ['medical', 'wiba'], true) && ! empty($validated['members'])) {
            foreach ($validated['members'] as $index => $member) {
                PolicyMember::create([
                    'policy_id' => $policy->id,
                    'name' => $member['name'],
                    'payroll_number' => $member['payroll_number'] ?? ($member['identifier'] ?? null),
                    'id_number' => $member['id_number'] ?? ($member['identifier'] ?? null),
                    'phone' => $member['phone'] ?? null,
                    'annual_salary' => $member['annual_salary'] ?? null,
                    'relationship' => $member['relationship'],
                    'notes' => null,
                ]);
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'policy_id' => $policy->id,
                'policy_type' => $policy->policy_type,
            ]);
        }

        return to_route('policies.show', $policy)->with('success', 'Policy created successfully.');
    }

    public function show(Policy $policy): Response
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $policy->load(['client', 'underwriter', 'insurer', 'quotation', 'documents', 'riskNotes']);

        $documents = $policy->documents->map(fn ($doc) => [
            'id' => $doc->id,
            'name' => $doc->name,
            'url' => Storage::disk('public')->url($doc->file_path),
            'mime_type' => $doc->mime_type,
            'size' => $doc->size,
        ]);

        $riskNote = $policy->riskNotes->first();

        return Inertia::render('policies/show', [
            'policy' => $policy,
            'documents' => $documents,
            'linkedRiskNote' => $riskNote ? [
                'id' => $riskNote->id,
                'line_type' => $riskNote->line_type,
                'risk_note_number' => $riskNote->risk_note_number,
            ] : null,
        ]);
    }

    public function edit(Policy $policy): Response
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        return Inertia::render('policies/edit', [
            'policy' => $policy->load(['client', 'underwriter', 'insurer', 'quotation']),
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
            'quotations' => Quotation::query()
                ->orderBy('quotation_number')
                ->get([
                    'id',
                    'quotation_number',
                    'client_id',
                    'underwriter_id',
                    'insurer_id',
                    'premium_amount',
                    'currency',
                    'valid_until',
                    'policy_type',
                    'notes',
                ]),
        ]);
    }

    public function update(UpdatePolicyRequest $request, Policy $policy, PolicyService $service): RedirectResponse
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $service->update($policy, $request->validated());

        return to_route('policies.show', $policy)->with('success', 'Policy updated successfully.');
    }

    public function destroy(Policy $policy, PolicyService $service): RedirectResponse
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $service->delete($policy);

        return to_route('policies.index');
    }

    public function createRiskNoteFromPolicy(Policy $policy, RiskNoteService $riskNoteService): JsonResponse
    {
        $this->access->assertCanViewPolicy(auth()->user(), $policy);

        $riskNote = $riskNoteService->createRiskNoteFromPolicy($policy, auth()->user());

        $showUrl = match ($riskNote->line_type) {
            'motor' => route('motor-risks.show', $riskNote),
            'medical' => route('medical-risks.show', $riskNote),
            default => route('wiba-risks.show', $riskNote),
        };

        return response()->json([
            'risk_note_id' => $riskNote->id,
            'line_type' => $riskNote->line_type,
            'url' => $showUrl,
        ]);
    }

    /**
     * @return Collection<int, Underwriter>
     */
    private function underwriterSelectOptionsWithInsurers()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            return Underwriter::query()
                ->where('user_id', $user->id)
                ->with(['insurers:id,name'])
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Underwriter::query()
            ->with(['insurers:id,name'])
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return Collection<int, Insurer>
     */
    private function insurerSelectOptions()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if (! $uwId) {
                return collect();
            }

            return Insurer::query()
                ->whereIn('id', function ($q) use ($uwId) {
                    $q->select('insurer_id')
                        ->from('insurer_underwriter')
                        ->where('underwriter_id', (int) $uwId);
                })
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Insurer::query()->orderBy('name')->get(['id', 'name']);
    }

    private function resolveActiveMotorBinderVersionId(int $insurerId): ?int
    {
        return BinderVersion::query()
            ->where('is_active', true)
            ->whereHas('binder', function ($query) use ($insurerId): void {
                $query->where('insurer_id', $insurerId)
                    ->where('line_type', 'motor')
                    ->where('status', 'active');
            })
            ->orderByDesc('id')
            ->value('id');
    }

    private function generateInternalPolicyNumber(Policy $policy): string
    {
        return sprintf('INI-%s-%s', $policy->id, now()->format('Y'));
    }
}
