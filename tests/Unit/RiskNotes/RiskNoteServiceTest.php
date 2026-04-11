<?php

namespace Tests\Unit\RiskNotes;

use App\Models\Client;
use App\Models\Insurer;
use App\Models\MotorPolicyDetail;
use App\Models\Policy;
use App\Models\Underwriter;
use App\Models\User;
use App\Services\RiskNotes\RiskNoteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiskNoteServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_risk_note_from_motor_policy_uses_vehicle_registration_number(): void
    {
        $user = User::factory()->create();
        $client = Client::query()->create([
            'type' => 'individual',
            'name' => 'Motor Client',
            'id_number' => '12345678',
            'phone' => '+254700000001',
            'email' => 'motor-client@example.com',
            'address' => 'Nairobi',
        ]);
        $underwriter = Underwriter::query()->create([
            'name' => 'Motor UW',
            'phone' => '+254700000002',
            'email' => 'motor-uw@example.com',
            'address' => 'Nairobi',
        ]);
        $insurer = Insurer::query()->create(['name' => 'Insurer A']);

        $policy = Policy::query()->create([
            'client_id' => $client->id,
            'underwriter_id' => $underwriter->id,
            'insurer_id' => $insurer->id,
            'policy_number' => 'POL-001',
            'policy_type' => 'motor',
            'status' => 'pending',
            'start_date' => '2026-04-01',
            'end_date' => '2026-05-01',
            'premium_amount' => 10000,
            'currency' => 'KES',
        ]);

        MotorPolicyDetail::query()->create([
            'policy_id' => $policy->id,
            'vehicle_use' => 'private',
            'cover_type' => 'comprehensive',
            'registration_number' => 'KDA128A',
            'vehicle_model' => 'Toyota Axio',
            'year_of_manufacture' => 2021,
            'chassis_number' => 'CHASSIS-001',
            'engine_number' => 'ENGINE-001',
            'vehicle_color' => 'Silver',
            'carriage_capacity' => 1.5,
        ]);

        $riskNote = app(RiskNoteService::class)->createRiskNoteFromPolicy($policy, $user);

        self::assertSame('KDA128A', $riskNote->motorDetails?->registration_number);
    }

    public function test_generated_motor_risk_note_content_hides_underwriter_name(): void
    {
        $user = User::factory()->create();
        $client = Client::query()->create([
            'type' => 'individual',
            'name' => 'Client One',
            'id_number' => '87654321',
            'phone' => '+254700000003',
            'email' => 'client-one@example.com',
            'address' => 'Nairobi',
        ]);
        $underwriter = Underwriter::query()->create([
            'name' => 'Hidden UW',
            'phone' => '+254700000004',
            'email' => 'hidden-uw@example.com',
            'address' => 'Nairobi',
        ]);
        $insurer = Insurer::query()->create(['name' => 'Insurer B']);

        $service = app(RiskNoteService::class);

        $motorRiskNote = $service->createMotorRiskNote([
            'client_id' => $client->id,
            'underwriter_id' => $underwriter->id,
            'insurer_id' => $insurer->id,
            'start_date' => '2026-04-01',
            'end_date' => '2026-05-01',
            'premium_amount' => 10000,
            'currency' => 'KES',
            'insured_name' => 'Client One',
            'insured_id_number' => '87654321',
            'insured_phone' => '+254700000003',
            'insured_email' => 'client-one@example.com',
            'insured_postal_address' => 'Nairobi',
            'registration_number' => 'KDA128A',
            'make_model' => 'Toyota Axio',
            'year_of_manufacture' => 2021,
            'chassis_number' => 'CHASSIS-002',
            'engine_number' => 'ENGINE-002',
            'body_type' => 'Saloon',
            'vehicle_use' => 'private',
            'cover_type' => 'comprehensive',
            'sum_insured' => 1200000,
        ], $user);

        $service->generateMotorRiskNoteContent($motorRiskNote);

        self::assertStringNotContainsString('Underwriter:', (string) $motorRiskNote->fresh()->risk_note_content);
    }
}
