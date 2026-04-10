<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motor_policy_details', function (Blueprint $table) {
            $table->string('cover_plan', 100)->nullable()->after('commercial_class');
            $table->json('cover_addons')->nullable()->after('cover_plan');
            $table->string('registration_number', 50)->nullable()->after('capacity_unit');
            $table->string('vehicle_make', 100)->nullable()->after('registration_number');
            $table->unsignedSmallInteger('year_of_manufacture')->nullable()->after('vehicle_model');
            $table->decimal('vehicle_value', 14, 2)->nullable()->after('year_of_manufacture');
        });
    }

    public function down(): void
    {
        Schema::table('motor_policy_details', function (Blueprint $table) {
            $table->dropColumn([
                'cover_plan',
                'cover_addons',
                'registration_number',
                'vehicle_make',
                'year_of_manufacture',
                'vehicle_value',
            ]);
        });
    }
};
