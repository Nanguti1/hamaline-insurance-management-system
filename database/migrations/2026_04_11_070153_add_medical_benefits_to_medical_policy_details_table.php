<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medical_policy_details', function (Blueprint $table) {
            $table->boolean('outpatient_benefit')->default(false);
            $table->decimal('outpatient_amount', 10, 2)->nullable();
            $table->boolean('inpatient_benefit')->default(false);
            $table->decimal('inpatient_amount', 10, 2)->nullable();
            $table->boolean('optical_benefit')->default(false);
            $table->decimal('optical_amount', 10, 2)->nullable();
            $table->boolean('maternity_benefit')->default(false);
            $table->decimal('maternity_amount', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medical_policy_details', function (Blueprint $table) {
            $table->dropColumn([
                'outpatient_benefit',
                'outpatient_amount',
                'inpatient_benefit',
                'inpatient_amount',
                'optical_benefit',
                'optical_amount',
                'maternity_benefit',
                'maternity_amount',
            ]);
        });
    }
};
