<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->string('vehicle_class', 100)->nullable()->after('installment_count');
            $table->string('vehicle_make_model', 150)->nullable()->after('vehicle_class');
            $table->unsignedSmallInteger('year_of_manufacture')->nullable()->after('vehicle_make_model');
            $table->string('registration_number', 50)->nullable()->after('year_of_manufacture');
            $table->decimal('sum_insured', 14, 2)->nullable()->after('registration_number');
            $table->decimal('quoted_base_premium', 14, 2)->nullable()->after('sum_insured');
            $table->decimal('quoted_training_levy', 14, 2)->nullable()->after('quoted_base_premium');
            $table->decimal('quoted_phcf', 14, 2)->nullable()->after('quoted_training_levy');
            $table->decimal('quoted_stamp_duty', 14, 2)->nullable()->after('quoted_phcf');
            $table->decimal('quoted_total_premium', 14, 2)->nullable()->after('quoted_stamp_duty');
            $table->text('interests_insured')->nullable()->after('quoted_total_premium');
            $table->text('excess_remarks')->nullable()->after('interests_insured');
            $table->string('prepared_by', 150)->nullable()->after('excess_remarks');
            $table->string('reviewed_by', 150)->nullable()->after('prepared_by');
            $table->date('quoted_on')->nullable()->after('reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn([
                'vehicle_class',
                'vehicle_make_model',
                'year_of_manufacture',
                'registration_number',
                'sum_insured',
                'quoted_base_premium',
                'quoted_training_levy',
                'quoted_phcf',
                'quoted_stamp_duty',
                'quoted_total_premium',
                'interests_insured',
                'excess_remarks',
                'prepared_by',
                'reviewed_by',
                'quoted_on',
            ]);
        });
    }
};
