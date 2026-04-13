<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motor_risk_note_details', function (Blueprint $table) {
            $table->string('insurer_policy_number', 80)->nullable()->after('insured_postal_address');
            $table->string('internal_policy_number', 80)->nullable()->after('insurer_policy_number');
            $table->string('binder_name', 255)->nullable()->after('internal_policy_number');
            $table->string('customer_id', 80)->nullable()->after('binder_name');
            $table->string('mobile_number', 50)->nullable()->after('customer_id');
            $table->string('telephone_other', 50)->nullable()->after('mobile_number');
            $table->string('postal_code', 20)->nullable()->after('telephone_other');
            $table->string('country', 80)->nullable()->after('postal_code');
            $table->string('bank_account_number', 80)->nullable()->after('country');
            $table->string('branch_code', 50)->nullable()->after('bank_account_number');
            $table->string('pin_number', 50)->nullable()->after('branch_code');

            $table->date('time_on_risk_start_date')->nullable()->after('sum_insured');
            $table->date('time_on_risk_end_date')->nullable()->after('time_on_risk_start_date');
            $table->unsignedInteger('passenger_count')->nullable()->after('time_on_risk_end_date');
            $table->string('logbook_status', 50)->nullable()->after('passenger_count');
            $table->decimal('accessories_value', 14, 2)->nullable()->after('logbook_status');
            $table->decimal('windscreen_value', 14, 2)->nullable()->after('accessories_value');
            $table->decimal('radio_value', 14, 2)->nullable()->after('windscreen_value');

            $table->json('limits_liability')->nullable()->after('radio_value');
            $table->json('excess_rules')->nullable()->after('limits_liability');
            $table->json('applicable_clauses')->nullable()->after('excess_rules');
            $table->json('exclusions')->nullable()->after('applicable_clauses');

            $table->decimal('time_on_risk_premium', 14, 2)->nullable()->after('exclusions');
            $table->decimal('policyholders_fund', 14, 2)->nullable()->after('time_on_risk_premium');
            $table->decimal('training_levy', 14, 2)->nullable()->after('policyholders_fund');
            $table->decimal('first_premium_total', 14, 2)->nullable()->after('training_levy');
            $table->decimal('time_on_risk_total_premium', 14, 2)->nullable()->after('first_premium_total');
            $table->string('payment_method', 50)->nullable()->after('time_on_risk_total_premium');
            $table->string('issuing_officer_name', 255)->nullable()->after('payment_method');
            $table->string('verifying_officer_name', 255)->nullable()->after('issuing_officer_name');
            $table->date('issued_on')->nullable()->after('verifying_officer_name');
        });
    }

    public function down(): void
    {
        Schema::table('motor_risk_note_details', function (Blueprint $table) {
            $table->dropColumn([
                'insurer_policy_number',
                'internal_policy_number',
                'binder_name',
                'customer_id',
                'mobile_number',
                'telephone_other',
                'postal_code',
                'country',
                'bank_account_number',
                'branch_code',
                'pin_number',
                'time_on_risk_start_date',
                'time_on_risk_end_date',
                'passenger_count',
                'logbook_status',
                'accessories_value',
                'windscreen_value',
                'radio_value',
                'limits_liability',
                'excess_rules',
                'applicable_clauses',
                'exclusions',
                'time_on_risk_premium',
                'policyholders_fund',
                'training_levy',
                'first_premium_total',
                'time_on_risk_total_premium',
                'payment_method',
                'issuing_officer_name',
                'verifying_officer_name',
                'issued_on',
            ]);
        });
    }
};

