<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motor_policy_details', function (Blueprint $table) {
            $table->string('payment_plan_type', 20)->nullable()->after('payment_method');
            $table->unsignedTinyInteger('installment_count')->nullable()->after('payment_plan_type');
            $table->decimal('installment_amount', 14, 2)->nullable()->after('installment_count');
        });

        Schema::table('motor_risk_note_details', function (Blueprint $table) {
            $table->string('payment_plan_type', 20)->nullable()->after('payment_method');
            $table->unsignedTinyInteger('installment_count')->nullable()->after('payment_plan_type');
            $table->decimal('installment_amount', 14, 2)->nullable()->after('installment_count');
        });
    }

    public function down(): void
    {
        Schema::table('motor_policy_details', function (Blueprint $table) {
            $table->dropColumn(['payment_plan_type', 'installment_count', 'installment_amount']);
        });

        Schema::table('motor_risk_note_details', function (Blueprint $table) {
            $table->dropColumn(['payment_plan_type', 'installment_count', 'installment_amount']);
        });
    }
};

