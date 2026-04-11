<?php

namespace Tests\Unit;

use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\StoreClientMedicalCategoryRequest;
use App\Http\Requests\Policies\ProgressivePolicyStoreRequest;
use App\Http\Requests\Quotations\StoreQuotationRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class PolicyAndClientValidationTest extends TestCase
{
    public function test_policy_number_is_optional_for_progressive_policy(): void
    {
        $request = new ProgressivePolicyStoreRequest;
        $rules = $this->withoutDatabaseRules($request->rules());

        $validator = Validator::make([
            'client_id' => 1,
            'underwriter_id' => 1,
            'policy_type' => 'motor',
            'client_type' => 'individual',
            'policy_number' => null,
            'start_date' => '2026-04-01',
            'end_date' => '2026-05-01',
            'premium_amount' => 1000,
            'currency' => 'KES',
            'vehicle_use' => 'private',
            'cover_type' => 'third_party',
            'private_use_class' => 'hire',
        ], $rules);

        self::assertFalse($validator->fails());
    }

    public function test_client_creation_requires_document_uploads(): void
    {
        $request = new StoreClientRequest;
        $rules = $this->withoutDatabaseRules($request->rules());

        $validator = Validator::make([
            'type' => 'individual',
            'name' => 'Jane Doe',
            'id_number' => '12345678',
            'kra_pin' => 'A123456789Z',
            'phone' => '+254700000000',
            'email' => 'jane@example.test',
            'address' => 'Nairobi',
        ], $rules);

        self::assertTrue($validator->fails());
        self::assertArrayHasKey('national_id_document', $validator->errors()->toArray());
        self::assertArrayHasKey('kra_pin_document', $validator->errors()->toArray());
    }

    public function test_client_creation_accepts_required_document_uploads(): void
    {
        $request = new StoreClientRequest;
        $rules = $this->withoutDatabaseRules($request->rules());

        $validator = Validator::make([
            'type' => 'individual',
            'name' => 'Jane Doe',
            'id_number' => '12345678',
            'kra_pin' => 'A123456789Z',
            'phone' => '+254700000000',
            'email' => 'jane2@example.test',
            'address' => 'Nairobi',
            'national_id_document' => UploadedFile::fake()->create('id.pdf', 50),
            'kra_pin_document' => UploadedFile::fake()->create('kra.pdf', 50),
        ], $rules);

        self::assertFalse($validator->fails());
    }

    public function test_corporate_medical_members_must_use_employee_relationship(): void
    {
        $request = new ProgressivePolicyStoreRequest;
        $rules = $this->withoutDatabaseRules($request->rules());

        $validator = Validator::make([
            'client_id' => 1,
            'insurer_id' => 1,
            'underwriter_id' => 1,
            'policy_type' => 'medical',
            'client_type' => 'corporate',
            'start_date' => '2026-04-01',
            'end_date' => '2026-05-01',
            'premium_amount' => 1000,
            'currency' => 'KES',
            'medical_category' => 'A',
            'members' => [[
                'name' => 'Jane Doe',
                'relationship' => 'Spouse',
                'phone' => '+254700000000',
                'id_number' => '12345678',
                'payroll_number' => 'PR-100',
                'annual_salary' => 1200000,
            ]],
        ], $rules);

        self::assertTrue($validator->fails());
        self::assertArrayHasKey('members.0.relationship', $validator->errors()->toArray());
    }

    public function test_installments_accept_between_two_and_ten(): void
    {
        $request = new StoreQuotationRequest;
        $rules = $this->withoutDatabaseRules($request->rules());

        $valid = Validator::make([
            'client_id' => 1,
            'underwriter_id' => 1,
            'insurer_id' => 1,
            'status' => 'draft',
            'premium_amount' => 1000000,
            'currency' => 'KES',
            'valid_until' => '2026-05-01',
            'policy_type' => 'medical',
            'payment_plan' => 'installments',
            'installment_count' => 10,
        ], $rules);

        self::assertFalse($valid->fails());

        $invalid = Validator::make([
            'client_id' => 1,
            'underwriter_id' => 1,
            'insurer_id' => 1,
            'status' => 'draft',
            'premium_amount' => 1000000,
            'currency' => 'KES',
            'valid_until' => '2026-05-01',
            'policy_type' => 'medical',
            'payment_plan' => 'installments',
            'installment_count' => 11,
        ], $rules);

        self::assertTrue($invalid->fails());
        self::assertArrayHasKey('installment_count', $invalid->errors()->toArray());
    }

    public function test_client_medical_category_requires_identifier(): void
    {
        $request = new StoreClientMedicalCategoryRequest;
        $rules = $this->withoutDatabaseRules($request->rules());

        $validator = Validator::make([
            'category_code' => 'A',
            'category_name' => 'Executive Plan',
            'description' => 'Category for executives',
            'is_active' => true,
        ], $rules);

        self::assertTrue($validator->fails());
        self::assertArrayHasKey('category_identifier', $validator->errors()->toArray());
    }

    /**
     * @param  array<string, mixed>  $rules
     * @return array<string, mixed>
     */
    private function withoutDatabaseRules(array $rules): array
    {
        foreach ($rules as $field => $ruleSet) {
            if (! is_array($ruleSet)) {
                continue;
            }

            $rules[$field] = array_values(array_filter($ruleSet, function (mixed $rule): bool {
                return is_string($rule)
                    ? ! str_starts_with($rule, 'exists:') && ! str_starts_with($rule, 'unique:')
                    : true;
            }));
        }

        return $rules;
    }
}
