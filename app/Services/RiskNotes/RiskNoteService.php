<?php

namespace App\Services\RiskNotes;

use App\Concerns\TracksUserStamps;
use App\Models\MedicalMember;
use App\Models\MedicalRiskNoteDetails;
use App\Models\MotorRiskNoteDetails;
use App\Models\Policy;
use App\Models\PolicyMember;
use App\Models\RiskNote;
use App\Models\User;
use App\Models\WibaEmployee;
use Illuminate\Support\Facades\DB;

class RiskNoteService
{
    public function createRiskNoteFromPolicy(Policy $policy, User $user): RiskNote
    {
        $policy->loadMissing(['client', 'motorDetail', 'medicalDetail', 'wibaDetail', 'members']);

        $existing = RiskNote::query()
            ->where('policy_id', $policy->id)
            ->where('line_type', $policy->policy_type)
            ->first();

        if ($existing) {
            return $existing;
        }

        if ($policy->policy_type === 'motor') {
            $coverType = $policy->motorDetail?->cover_type === 'third_party'
                ? 'third_party_only'
                : ($policy->motorDetail?->cover_type ?? 'comprehensive');

            $motorDetail = $policy->motorDetail;

            $riskNote = $this->createMotorRiskNote([
                'client_id' => $policy->client_id,
                'underwriter_id' => $policy->underwriter_id,
                'insurer_id' => $policy->insurer_id,
                'start_date' => $policy->start_date?->toDateString(),
                'end_date' => $policy->end_date?->toDateString(),
                'premium_amount' => (float) ($policy->premium_amount ?? 0),
                'currency' => $policy->currency ?? 'KES',
                'notes' => $policy->notes,
                'insured_name' => $policy->client?->display_name ?? 'To be captured',
                'insured_id_number' => $policy->client?->identifier ?? 'TO-BE-CAPTURED',
                'insured_phone' => $policy->client?->phone ?? 'TO-BE-CAPTURED',
                'insured_email' => $policy->client?->email ?? 'to-be-captured@example.com',
                'insured_postal_address' => $policy->client?->address ?? 'To be captured',
                'registration_number' => $policy->policy_number ?? ('PENDING-'.$policy->id),
                'make_model' => $motorDetail?->vehicle_model ?? 'To be captured',
                'year_of_manufacture' => (int) now()->year,
                'chassis_number' => $motorDetail?->chassis_number ?? 'TO-BE-CAPTURED',
                'engine_number' => $motorDetail?->engine_number ?? 'TO-BE-CAPTURED',
                'body_type' => $motorDetail?->vehicle_color ?? 'To be captured',
                'vehicle_use' => $motorDetail?->vehicle_use ?? 'private',
                'cover_type' => $coverType,
                'sum_insured' => (float) (($motorDetail?->carriage_capacity ?? 0) * 1000),
            ], $user);
            $riskNote->update(['policy_id' => $policy->id]);

            return $riskNote->refresh();
        }

        if ($policy->policy_type === 'medical') {
            $benefitsMap = [];
            if ($policy->medicalDetail) {
                if ($policy->medicalDetail->outpatient_benefit) {
                    $benefitsMap['outpatient'] = $policy->medicalDetail->outpatient_amount ?? 0;
                }
                if ($policy->medicalDetail->inpatient_benefit) {
                    $benefitsMap['inpatient'] = $policy->medicalDetail->inpatient_amount ?? 0;
                }
                if ($policy->medicalDetail->optical_benefit) {
                    $benefitsMap['optical'] = $policy->medicalDetail->optical_amount ?? 0;
                }
                if ($policy->medicalDetail->maternity_benefit) {
                    $benefitsMap['maternity'] = $policy->medicalDetail->maternity_amount ?? 0;
                }
            }
            
            $members = $this->mapPolicyMembersToMedicalMembers(
                $policy,
                $benefitsMap
            );

            $riskNote = $this->createMedicalRiskNote([
                'client_id' => $policy->client_id,
                'underwriter_id' => $policy->underwriter_id,
                'insurer_id' => $policy->insurer_id,
                'plan_type' => $policy->client?->type === 'corporate' ? 'corporate' : 'individual',
                'corporate_category_code' => $policy->medicalDetail?->medical_category,
                'junior_children_count' => null,
                'start_date' => $policy->start_date?->toDateString(),
                'end_date' => $policy->end_date?->toDateString(),
                'premium_amount' => (float) ($policy->premium_amount ?? 0),
                'currency' => $policy->currency ?? 'KES',
                'notes' => $policy->notes,
                'members' => $members,
            ], $user);
            $riskNote->update(['policy_id' => $policy->id]);

            return $riskNote->refresh();
        }

        $employees = $this->mapPolicyMembersToWibaEmployees($policy);

        $riskNote = $this->createWibaRiskNote([
            'client_id' => $policy->client_id,
            'underwriter_id' => $policy->underwriter_id,
            'insurer_id' => $policy->insurer_id,
            'start_date' => $policy->start_date?->toDateString(),
            'end_date' => $policy->end_date?->toDateString(),
            'premium_amount' => (float) ($policy->premium_amount ?? 0),
            'currency' => $policy->currency ?? 'KES',
            'notes' => $policy->notes,
            'employees' => $employees,
        ], $user);
        $riskNote->update(['policy_id' => $policy->id]);

        return $riskNote->refresh();
    }

    use TracksUserStamps;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Create a risk note with Medical details.
     *
     * @param  array<string, mixed>  $data
     */
    public function createMedicalRiskNote(array $data, User $user): RiskNote
    {
        return DB::transaction(function () use ($data): RiskNote {
            $lineType = 'medical';
            $riskNote = RiskNote::create([
                'line_type' => $lineType,
                'risk_note_number' => $this->nextRiskNoteNumber($lineType),
                'client_id' => $data['client_id'],
                'underwriter_id' => $data['underwriter_id'],
                'insurer_id' => $data['insurer_id'] ?? null,
                'status' => self::STATUS_DRAFT,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'premium_amount' => $data['premium_amount'] ?? 0,
                'currency' => $data['currency'] ?? 'KES',
                'notes' => $data['notes'] ?? null,
                ...$this->withCreateAudit([]),
            ]);

            $MedicalDetails = MedicalRiskNoteDetails::create([
                'risk_note_id' => $riskNote->id,
                'plan_type' => $data['plan_type'],
                'corporate_category_code' => $data['corporate_category_code'] ?? null,
                'junior_children_count' => $data['junior_children_count'] ?? null,
            ]);

            // Members
            $members = $data['members'] ?? [];
            foreach ($members as $member) {
                $memberRow = $riskNote->medicalMembers()->create([
                    'member_sequence' => (int) $member['member_sequence'],
                    'is_principal' => (bool) ($member['is_principal'] ?? false),
                    'member_number' => $member['member_number'] ?? null,
                    'relationship' => $member['relationship'],
                    'name' => $member['name'],
                    'date_of_birth' => $member['date_of_birth'],
                    'phone' => $member['phone'],
                    'id_number' => $member['id_number'] ?? null,
                    'birth_certificate_number' => $member['birth_certificate_number'] ?? null,
                ]);

                foreach (($member['benefits'] ?? []) as $benefit) {
                    $memberRow->benefits()->create([
                        'benefit_type' => $benefit['benefit_type'],
                        'amount' => $benefit['amount'],
                    ]);
                }
            }

            // Ensure the details relation is actually created
            $riskNote->setRelation('medicalDetails', $MedicalDetails);

            return $riskNote->refresh();
        });
    }

    /**
     * Create a Motor risk note.
     *
     * @param  array<string, mixed>  $data
     */
    public function createMotorRiskNote(array $data, User $user): RiskNote
    {
        return DB::transaction(function () use ($data): RiskNote {
            $lineType = 'motor';
            $riskNote = RiskNote::create([
                'line_type' => $lineType,
                'risk_note_number' => $this->nextRiskNoteNumber($lineType),
                'client_id' => $data['client_id'],
                'underwriter_id' => $data['underwriter_id'],
                'insurer_id' => $data['insurer_id'] ?? null,
                'status' => self::STATUS_DRAFT,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'premium_amount' => $data['premium_amount'] ?? 0,
                'currency' => $data['currency'] ?? 'KES',
                'notes' => $data['notes'] ?? null,
            ] + $this->withCreateAudit([]));

            MotorRiskNoteDetails::create([
                'risk_note_id' => $riskNote->id,

                'insured_name' => $data['insured_name'],
                'insured_id_number' => $data['insured_id_number'],
                'insured_phone' => $data['insured_phone'],
                'insured_email' => $data['insured_email'],
                'insured_postal_address' => $data['insured_postal_address'],

                'registration_number' => $data['registration_number'],
                'make_model' => $data['make_model'],
                'year_of_manufacture' => $data['year_of_manufacture'],
                'chassis_number' => $data['chassis_number'],
                'engine_number' => $data['engine_number'],
                'body_type' => $data['body_type'],
                'vehicle_use' => $data['vehicle_use'],

                'cover_type' => $data['cover_type'],
                'sum_insured' => $data['sum_insured'] ?? 0,
            ]);

            return $riskNote->refresh();
        });
    }

    /**
     * Create a WIBA risk note.
     *
     * @param  array<string, mixed>  $data
     */
    public function createWibaRiskNote(array $data, User $user): RiskNote
    {
        return DB::transaction(function () use ($data): RiskNote {
            $lineType = 'wiba';

            $riskNote = RiskNote::create([
                'line_type' => $lineType,
                'risk_note_number' => $this->nextRiskNoteNumber($lineType),
                'client_id' => $data['client_id'],
                'underwriter_id' => $data['underwriter_id'],
                'insurer_id' => $data['insurer_id'] ?? null,
                'status' => self::STATUS_DRAFT,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'premium_amount' => $data['premium_amount'] ?? 0,
                'currency' => $data['currency'] ?? 'KES',
                'notes' => $data['notes'] ?? null,
            ] + $this->withCreateAudit([]));

            foreach (($data['employees'] ?? []) as $emp) {
                WibaEmployee::create([
                    'risk_note_id' => $riskNote->id,
                    'employee_sequence' => (int) $emp['employee_sequence'],
                    'name' => $emp['name'],
                    'payroll_number' => $emp['payroll_number'],
                    'id_number' => $emp['id_number'],
                    'date_of_birth' => $emp['date_of_birth'],
                    'annual_salary' => $emp['annual_salary'] ?? 0,
                ]);
            }

            return $riskNote->refresh();
        });
    }

    public function generateMotorRiskNoteContent(RiskNote $riskNote): RiskNote
    {
        if ($riskNote->line_type !== 'motor') {
            throw new \InvalidArgumentException('Risk note line_type must be motor.');
        }

        $riskNote->load(['client', 'underwriter', 'insurer', 'motorDetails']);

        $period = ($riskNote->start_date && $riskNote->end_date)
            ? sprintf('%s - %s', $riskNote->start_date->format('Y-m-d'), $riskNote->end_date->format('Y-m-d'))
            : '-';

        $d = $riskNote->motorDetails;
        $coverLabel = match ($d?->cover_type) {
            'third_party_only' => 'Third Party Only',
            'third_party_fire_theft' => 'Third Party Fire & Theft',
            'comprehensive' => 'Comprehensive',
            default => $d?->cover_type ?? '-',
        };

        $riskNoteContent = implode(PHP_EOL, [
            '=== MOTOR RISK NOTE ===',
            'Header',
            sprintf('Risk Note Number: %s', $riskNote->risk_note_number),
            sprintf('Date of Issue: %s', now()->format('Y-m-d')),
            sprintf('Agency Name: Hamline Insurance Agency'),
            sprintf('Insurer: %s', $riskNote->insurer?->name ?? '-'),
            '',
            'Insured Information',
            sprintf('Name: %s', $d?->insured_name ?? '-'),
            sprintf('Underwriter: %s', $riskNote->underwriter?->name ?? '-'),
            sprintf('Period of Insurance: %s', $period),
            '',
            'Vehicle Details',
            sprintf('Registration Number: %s', $d?->registration_number ?? '-'),
            sprintf('Make & Model: %s', $d?->make_model ?? '-'),
            sprintf('Year of Manufacture: %s', $d?->year_of_manufacture ?? '-'),
            sprintf('Chassis Number: %s', $d?->chassis_number ?? '-'),
            sprintf('Engine Number: %s', $d?->engine_number ?? '-'),
            sprintf('Body Type: %s', $d?->body_type ?? '-'),
            sprintf('Use of Vehicle: %s', $d?->vehicle_use ?? '-'),
            '',
            'Insurance Cover',
            sprintf('Cover Type: %s', $coverLabel),
            sprintf('Sum Insured: %s', $d?->sum_insured ?? 0),
            '',
            'Financials',
            sprintf('Premium Payable: %s %s', sprintf('%.2f', (float) $riskNote->premium_amount), $riskNote->currency),
            '',
            'Conditions',
            '- Subject to full premium payment',
            '- Waiting periods / exclusions apply per underwriting rules',
            '',
            'Notes',
            '- This is not the final policy document',
            '- Serves as temporary confirmation of cover',
        ]);

        $riskNote->update([
            'risk_note_content' => $riskNoteContent,
            'notes' => $riskNote->notes,
        ]);

        return $riskNote->refresh();
    }

    public function generateWibaRiskNoteContent(RiskNote $riskNote): RiskNote
    {
        if ($riskNote->line_type !== 'wiba') {
            throw new \InvalidArgumentException('Risk note line_type must be wiba.');
        }

        $riskNote->load(['client', 'underwriter', 'insurer', 'wibaEmployees']);

        $period = ($riskNote->start_date && $riskNote->end_date)
            ? sprintf('%s - %s', $riskNote->start_date->format('Y-m-d'), $riskNote->end_date->format('Y-m-d'))
            : '-';

        $employees = $riskNote->wibaEmployees->sortBy('employee_sequence')->values();
        $employeeLines = [];
        foreach ($employees as $i => $e) {
            $employeeLines[] = sprintf(
                '| %d | %s | Payroll %s | %s | %s | %s |',
                $i + 1,
                $e->name,
                $e->payroll_number,
                $e->id_number,
                $e->date_of_birth?->format('Y-m-d') ?? '-',
                sprintf('%.2f', (float) $e->annual_salary)
            );
        }

        $employeeTable = implode(PHP_EOL, [
            '| No | Name | Payroll | ID Number | DOB | Annual Salary |',
            ...($employeeLines ?: ['| - | - | - | - | - | - |']),
        ]);

        $riskNoteContent = implode(PHP_EOL, [
            '=== WIBA RISK NOTE ===',
            'Header',
            sprintf('Risk Note Number: %s', $riskNote->risk_note_number),
            sprintf('Date of Issue: %s', now()->format('Y-m-d')),
            sprintf('Agency Name: Hamline Insurance Agency'),
            sprintf('Insurer: %s', $riskNote->insurer?->name ?? '-'),
            '',
            'Insured Information',
            sprintf('Corporate Name: %s', $riskNote->client?->display_name ?? '-'),
            sprintf('Underwriter: %s', $riskNote->underwriter?->name ?? '-'),
            sprintf('Period of Insurance: %s', $period),
            '',
            'Employees',
            $employeeTable,
            '',
            'Conditions',
            '- Subject to full premium payment',
            '- Waiting periods / exclusions apply per underwriting rules',
            '',
            'Notes',
            '- This is not the final policy document',
            '- Serves as temporary confirmation of cover',
        ]);

        $riskNote->update([
            'risk_note_content' => $riskNoteContent,
            'notes' => $riskNote->notes,
        ]);

        return $riskNote->refresh();
    }

    public function generateMedicalRiskNoteContent(RiskNote $riskNote): RiskNote
    {
        if ($riskNote->line_type !== 'medical') {
            throw new \InvalidArgumentException('Risk note line_type must be medical.');
        }

        $riskNote->load(['client', 'underwriter', 'insurer', 'medicalDetails', 'medicalMembers.benefits']);

        $principal = $riskNote->medicalMembers->firstWhere('is_principal', true);
        if (! $principal) {
            $principal = $riskNote->medicalMembers->sortBy('member_sequence')->first();
        }

        $dependants = $riskNote->medicalMembers
            ->filter(fn (MedicalMember $m) => ! $m->is_principal)
            ->sortBy('member_sequence')
            ->values();

        $benefitTypes = ['inpatient', 'outpatient', 'maternity', 'dental', 'optical'];
        $principalBenefits = $principal?->benefits ?? collect();

        $benefitSummary = [];
        foreach ($benefitTypes as $bt) {
            $label = match ($bt) {
                'inpatient' => 'Inpatient Cover',
                'outpatient' => 'Outpatient Cover',
                'maternity' => 'Maternity Cover',
                'dental' => 'Dental Cover',
                'optical' => 'Optical Cover',
                default => ucfirst($bt),
            };

            $row = $principalBenefits->firstWhere('benefit_type', $bt);
            $benefitSummary[] = sprintf('%s: %s', $label, $row ? (string) $row->amount : '-');
        }

        $period = ($riskNote->start_date && $riskNote->end_date)
            ? sprintf('%s - %s', $riskNote->start_date->format('Y-m-d'), $riskNote->end_date->format('Y-m-d'))
            : '-';

        $issueDate = now()->format('Y-m-d');
        $agencyName = 'Hamline Insurance Agency';

        $dependantsTableLines = [];
        foreach ($dependants as $i => $d) {
            $dependantsTableLines[] = sprintf(
                '| %d | %s | %s | %s |',
                $i + 1,
                $d->name,
                $d->relationship,
                $d->date_of_birth?->format('Y-m-d') ?? '-'
            );
        }

        $dependantsTable = implode(PHP_EOL, [
            '| No | Name | Relationship | Date of Birth |',
            ...($dependantsTableLines ?: ['| - | - | - | - |']),
        ]);

        $principalName = $principal?->name ?? '-';
        $underwriterName = $riskNote->underwriter?->name ?? '-';
        $insurerName = $riskNote->insurer?->name ?? '-';

        $riskNoteContent = implode(PHP_EOL, [
            '=== MEDICAL RISK NOTE ===',
            'Header',
            sprintf('Risk Note Number: %s', $riskNote->risk_note_number),
            sprintf('Date of Issue: %s', $issueDate),
            sprintf('Agency Name: %s', $agencyName),
            sprintf('Insurer: %s', $insurerName),
            '',
            'Insured Information',
            sprintf('Name: %s', $principalName),
            sprintf('Underwriter: %s', $underwriterName),
            sprintf('Period of Insurance: %s', $period),
            '',
            'Dependants',
            $dependantsTable,
            '',
            'Benefits Summary',
            ...$benefitSummary,
            '',
            'Conditions',
            '- Subject to full premium payment',
            '- Waiting periods apply',
            '- Pre-existing conditions handled per underwriting rules',
            '- Treatment limited to approved providers',
            '',
            'Notes',
            '- This is not the final policy document',
            '- Serves as temporary confirmation of cover',
        ]);

        $riskNote->update([
            'risk_note_content' => $riskNoteContent,
            'notes' => $riskNote->notes,
        ]);

        return $riskNote->refresh();
    }

    public function submitForUnderwriting(RiskNote $riskNote, User $user): RiskNote
    {
        if ($riskNote->status !== self::STATUS_DRAFT) {
            throw new \DomainException('Only draft risk notes can be submitted.');
        }

        $riskNote->update([
            'status' => self::STATUS_PENDING,
            'submitted_at' => now(),
            'updated_by' => $user->id,
        ]);

        return $riskNote->refresh();
    }

    public function approveUnderwriting(RiskNote $riskNote, User $user, ?string $decisionNotes = null): RiskNote
    {
        return DB::transaction(function () use ($riskNote, $user, $decisionNotes): RiskNote {
            if ($riskNote->status !== self::STATUS_PENDING) {
                throw new \DomainException('Only pending risk notes can be decided.');
            }

            $policyStatus = self::STATUS_ACTIVE; // will be mapped to Policy.status = active

            $insurerId = DB::table('insurer_underwriter')
                ->where('underwriter_id', (int) $riskNote->underwriter_id)
                ->orderBy('insurer_id')
                ->value('insurer_id');

            $decision = $riskNote->underwritingDecisions()->create([
                'underwriter_id' => $riskNote->underwriter_id,
                'decided_by' => $user->id,
                'decision' => 'approved',
                'decision_notes' => $decisionNotes,
                'decided_at' => now(),
            ]);

            $policyNumber = $this->nextPolicyNumber();

            $policy = Policy::create([
                'client_id' => $riskNote->client_id,
                'underwriter_id' => $riskNote->underwriter_id,
                'quotation_id' => null,
                'insurer_id' => $insurerId,
                'created_by' => $user->id,
                'updated_by' => $user->id,
                'approved_by' => $user->id,
                'policy_number' => $policyNumber,
                'policy_type' => $riskNote->line_type,
                'status' => $policyStatus === self::STATUS_ACTIVE ? 'active' : 'cancelled',
                'start_date' => $riskNote->start_date ?? now()->toDateString(),
                'end_date' => $riskNote->end_date ?? now()->toDateString(),
                'premium_amount' => $riskNote->premium_amount ?? 0,
                'currency' => $riskNote->currency ?? 'KES',
                'notes' => $riskNote->notes,
            ]);

            $riskNote->update([
                'status' => self::STATUS_ACTIVE,
                'decided_at' => now(),
                'approved_by' => $user->id,
                'policy_id' => $policy->id,
            ]);

            return $riskNote->refresh()->setRelation('policy', $policy);
        });
    }

    public function rejectUnderwriting(RiskNote $riskNote, User $user, ?string $decisionNotes = null): RiskNote
    {
        return DB::transaction(function () use ($riskNote, $user, $decisionNotes): RiskNote {
            if ($riskNote->status !== self::STATUS_PENDING) {
                throw new \DomainException('Only pending risk notes can be decided.');
            }

            $insurerId = DB::table('insurer_underwriter')
                ->where('underwriter_id', (int) $riskNote->underwriter_id)
                ->orderBy('insurer_id')
                ->value('insurer_id');

            $decision = $riskNote->underwritingDecisions()->create([
                'underwriter_id' => $riskNote->underwriter_id,
                'decided_by' => $user->id,
                'decision' => 'rejected',
                'decision_notes' => $decisionNotes,
                'decided_at' => now(),
            ]);

            $policyNumber = $this->nextPolicyNumber();

            $policy = Policy::create([
                'client_id' => $riskNote->client_id,
                'underwriter_id' => $riskNote->underwriter_id,
                'quotation_id' => null,
                'insurer_id' => $insurerId,
                'created_by' => $user->id,
                'updated_by' => $user->id,
                'approved_by' => $user->id,
                'policy_number' => $policyNumber,
                'policy_type' => $riskNote->line_type,
                'status' => 'cancelled',
                'start_date' => $riskNote->start_date ?? now()->toDateString(),
                'end_date' => $riskNote->end_date ?? now()->toDateString(),
                'premium_amount' => $riskNote->premium_amount ?? 0,
                'currency' => $riskNote->currency ?? 'KES',
                'notes' => $riskNote->notes,
            ]);

            $riskNote->update([
                'status' => self::STATUS_CANCELLED,
                'decided_at' => now(),
                'approved_by' => $user->id,
                'policy_id' => $policy->id,
            ]);

            return $riskNote->refresh()->setRelation('policy', $policy);
        });
    }

    public function cancelRiskNote(RiskNote $riskNote, User $user, ?string $reason = null): RiskNote
    {
        if (! in_array($riskNote->status, [self::STATUS_DRAFT, self::STATUS_PENDING], true)) {
            throw new \DomainException('Only draft/pending risk notes can be cancelled.');
        }

        $riskNote->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'updated_by' => $user->id,
        ]);

        return $riskNote->refresh();
    }

    private function nextRiskNoteNumber(string $lineType): string
    {
        $prefix = match ($lineType) {
            'medical' => 'MRN',
            'motor' => 'MTRN',
            'wiba' => 'WRN',
            default => strtoupper(substr($lineType, 0, 4)),
        };

        $year = now()->format('Y');
        $like = "{$prefix}-{$year}-%";

        $last = RiskNote::query()
            ->where('risk_note_number', 'like', $like)
            ->orderByDesc('id')
            ->first();

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last->risk_note_number, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%s-%04d', $prefix, $year, $seq);
    }

    private function nextPolicyNumber(): string
    {
        $year = now()->format('Y');
        $prefix = 'POL';
        $like = "{$prefix}-{$year}-%";

        $last = Policy::query()
            ->where('policy_number', 'like', $like)
            ->orderByDesc('id')
            ->first();

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last->policy_number, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%s-%04d', $prefix, $year, $seq);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function mapPolicyMembersToMedicalMembers(Policy $policy, array $benefitsMap = []): array
    {
        $benefits = collect($benefitsMap)
            ->map(fn (float $amount, string $benefitType): array => [
                'benefit_type' => $benefitType,
                'amount' => $amount,
            ])
            ->values()
            ->all();

        $policyMembers = $policy->members;
        if ($policyMembers->isEmpty()) {
            return [[
                'member_sequence' => 0,
                'is_principal' => true,
                'relationship' => 'principal',
                'name' => $policy->client?->display_name ?? 'Principal Member',
                'date_of_birth' => now()->toDateString(),
                'phone' => $policy->client?->phone ?? 'TO-BE-CAPTURED',
                'id_number' => $policy->client?->identifier ?? 'TO-BE-CAPTURED',
                'birth_certificate_number' => null,
                'benefits' => $benefits,
            ]];
        }

        return $policyMembers->values()->map(function (PolicyMember $member, int $index) use ($benefits): array {
            $relationship = strtolower((string) ($member->relationship ?? 'child'));
            if (! in_array($relationship, ['principal', 'spouse', 'child'], true)) {
                $relationship = $index === 0 ? 'principal' : 'child';
            }

            return [
                'member_sequence' => $index,
                'is_principal' => $index === 0,
                'relationship' => $index === 0 ? 'principal' : $relationship,
                'name' => $member->name,
                'date_of_birth' => $member->date_of_birth?->toDateString() ?? now()->toDateString(),
                'phone' => $member->phone,
                'id_number' => $member->id_number ?? 'TO-BE-CAPTURED',
                'birth_certificate_number' => null,
                'benefits' => $index === 0 ? $benefits : [],
            ];
        })->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function mapPolicyMembersToWibaEmployees(Policy $policy): array
    {
        $policyMembers = $policy->members;
        if ($policyMembers->isEmpty()) {
            return [[
                'employee_sequence' => 0,
                'name' => $policy->client?->display_name ?? 'Employee',
                'payroll_number' => 'TO-BE-CAPTURED',
                'id_number' => $policy->client?->identifier ?? 'TO-BE-CAPTURED',
                'date_of_birth' => now()->toDateString(),
                'annual_salary' => 0,
            ]];
        }

        return $policyMembers->values()->map(function (PolicyMember $member, int $index): array {
            return [
                'employee_sequence' => $index,
                'name' => $member->name,
                'payroll_number' => $member->payroll_number ?: 'TO-BE-CAPTURED',
                'id_number' => $member->id_number ?: 'TO-BE-CAPTURED',
                'date_of_birth' => $member->date_of_birth?->toDateString() ?? now()->toDateString(),
                'annual_salary' => (float) ($member->annual_salary ?? 0),
            ];
        })->all();
    }
}
