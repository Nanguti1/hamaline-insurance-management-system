<?php

namespace App\Http\Requests\RiskNotes;

use App\Http\Requests\Concerns\ValidatesUnderwriterBelongsToUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicalRiskNoteRequest extends FormRequest
{
    use ValidatesUnderwriterBelongsToUser;

    /**
     * @return array<string, array<int, string>>
     */
    private function corporateCategoryAllowedBenefits(): array
    {
        return [
            'A' => ['inpatient', 'outpatient', 'dental'],
            'B' => ['inpatient', 'outpatient', 'optical'],
            'C' => ['inpatient', 'maternity', 'dental'],
            'D' => ['inpatient', 'maternity', 'optical'],
            'E' => ['inpatient', 'outpatient', 'maternity', 'dental', 'optical'],
            'F' => ['inpatient', 'outpatient', 'dental', 'optical'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'plan_type' => ['required', Rule::in(['individual', 'junior', 'corporate'])],
            'corporate_category_code' => ['nullable', Rule::in(['A', 'B', 'C', 'D', 'E', 'F'])],
            'junior_children_count' => ['nullable', 'integer', 'min:1', 'max:50'],

            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],

            'premium_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'notes' => ['nullable', 'string', 'max:2000'],

            'members' => ['required', 'array', 'min:1'],

            'members.*.member_sequence' => ['required', 'integer', 'min:0'],
            'members.*.is_principal' => ['required', 'boolean'],
            'members.*.relationship' => ['required', Rule::in(['principal', 'spouse', 'child'])],

            'members.*.name' => ['required', 'string', 'max:255'],
            'members.*.date_of_birth' => ['required', 'date'],
            'members.*.phone' => ['required', 'string', 'max:50'],

            'members.*.id_number' => ['nullable', 'string', 'max:50'],
            'members.*.birth_certificate_number' => ['nullable', 'string', 'max:50'],

            // Benefit selection is optional per member; usually only principal member contains benefits.
            'members.*.benefits' => ['nullable', 'array'],
            'members.*.benefits.*.benefit_type' => [
                'required_with:members.*.benefits',
                Rule::in(['inpatient', 'outpatient', 'maternity', 'dental', 'optical']),
            ],
            'members.*.benefits.*.amount' => ['required_with:members.*.benefits', 'numeric', 'min:0'],
        ];
    }

    /**
     * @param  \Illuminate\Validation\Validator  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $planType = $this->input('plan_type');
            $members = $this->input('members', []);
            $corporateCategoryCode = $this->input('corporate_category_code');
            $allowedCorporateBenefits = $planType === 'corporate' && is_string($corporateCategoryCode)
                ? ($this->corporateCategoryAllowedBenefits()[$corporateCategoryCode] ?? [])
                : null;

            $principal = collect($members)->firstWhere('is_principal', true);
            if (! $principal) {
                $validator->errors()->add('members', 'A principal member (is_principal=true) is required.');
                return;
            }

            if (($principal['relationship'] ?? null) !== 'principal') {
                $validator->errors()->add('members', 'Principal member must have relationship=principal.');
            }

            // Member relationship semantics + required ID fields
            foreach ($members as $idx => $m) {
                $isPrincipal = (bool) ($m['is_principal'] ?? false);
                $rel = $m['relationship'] ?? null;

                if ($isPrincipal && $rel !== 'principal') {
                    $validator->errors()->add("members.$idx.relationship", 'Principal member must have relationship=principal.');
                }

                if (! $isPrincipal && $rel === 'principal') {
                    $validator->errors()->add("members.$idx.relationship", 'Only the principal member can have relationship=principal.');
                }

                if ($planType !== 'junior') {
                    if (empty($m['id_number'])) {
                        $validator->errors()->add("members.$idx.id_number", 'ID number is required for this medical plan.');
                    }
                }
            }

            if ($planType === 'corporate' && ! $this->input('corporate_category_code')) {
                $validator->errors()->add('corporate_category_code', 'Corporate plans require a category code.');
            }

            if ($planType === 'junior' && ! $this->input('junior_children_count')) {
                $validator->errors()->add('junior_children_count', 'Junior plans require number of children.');
            }

            if ($planType === 'junior') {
                foreach ($members as $idx => $m) {
                    $rel = $m['relationship'] ?? null;

                    if ($rel === 'child') {
                        if (empty($m['birth_certificate_number'])) {
                            $validator->errors()->add("members.$idx.birth_certificate_number", 'Birth certificate is required for junior children.');
                        }
                    } else {
                        if (empty($m['id_number'])) {
                            $validator->errors()->add("members.$idx.id_number", 'ID number is required for non-child members.');
                        }
                    }

                    // Junior benefits should not include maternity.
                    if (! empty($m['benefits']) && is_array($m['benefits'])) {
                        foreach ($m['benefits'] as $bIdx => $b) {
                            if (($b['benefit_type'] ?? null) === 'maternity') {
                                $validator->errors()->add(
                                    "members.$idx.benefits.$bIdx.benefit_type",
                                    'Maternity cover is not available for junior plans.'
                                );
                            }
                        }
                    }
                }
            }

            // Benefits rules:
            // 1) Only principal member can have selected benefits
            // 2) For corporate categories, only configured benefits are allowed
            foreach ($members as $idx => $m) {
                $memberBenefits = $m['benefits'] ?? null;
                if (! is_array($memberBenefits)) {
                    continue;
                }

                $isPrincipal = (bool) ($m['is_principal'] ?? false);
                if (! $isPrincipal && count($memberBenefits) > 0) {
                    $validator->errors()->add("members.$idx.benefits", 'Only the principal member can carry benefits.');
                    continue;
                }

                if ($isPrincipal && $planType === 'corporate' && is_array($memberBenefits) && $allowedCorporateBenefits !== null) {
                    foreach ($memberBenefits as $bIdx => $b) {
                        $bt = $b['benefit_type'] ?? null;
                        if (! is_string($bt)) {
                            continue;
                        }
                        if (! in_array($bt, $allowedCorporateBenefits, true)) {
                            $validator->errors()->add(
                                "members.$idx.benefits.$bIdx.benefit_type",
                                'Benefit is not allowed for the selected corporate category.'
                            );
                        }
                    }
                }
            }

            // Member sequence uniqueness (best effort).
            $sequences = collect($members)->pluck('member_sequence')->filter(fn ($v) => $v !== null);
            if ($sequences->count() !== $sequences->unique()->count()) {
                $validator->errors()->add('members', 'member_sequence values must be unique.');
            }
        });
    }
}

