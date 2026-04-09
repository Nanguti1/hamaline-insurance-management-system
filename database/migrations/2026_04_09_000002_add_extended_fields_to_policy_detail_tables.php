<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motor_policy_details', function (Blueprint $table) {
            $table->string('vehicle_model', 255)->nullable()->after('capacity_unit');
            $table->string('vehicle_color', 50)->nullable()->after('vehicle_model');
            $table->string('chassis_number', 100)->nullable()->after('vehicle_color');
            $table->string('engine_number', 100)->nullable()->after('chassis_number');
            $table->decimal('carriage_capacity', 10, 2)->nullable()->after('engine_number');
            $table->string('engine_size', 50)->nullable()->after('carriage_capacity');
        });

        Schema::table('medical_policy_details', function (Blueprint $table) {
            $table->json('benefits')->nullable()->after('medical_category');
        });
    }

    public function down(): void
    {
        Schema::table('motor_policy_details', function (Blueprint $table) {
            $table->dropColumn([
                'vehicle_model',
                'vehicle_color',
                'chassis_number',
                'engine_number',
                'carriage_capacity',
                'engine_size',
            ]);
        });

        Schema::table('medical_policy_details', function (Blueprint $table) {
            $table->dropColumn('benefits');
        });
    }
};
