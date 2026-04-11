<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_runs', function (Blueprint $table) {
            $table->longText('report_data')->nullable();

            $table->string('filter_client_type', 20)->nullable();
            $table->string('filter_policy_type', 50)->nullable();
            $table->string('filter_status', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('report_runs', function (Blueprint $table) {
            $table->dropColumn('report_data');
            $table->dropColumn('filter_client_type');
            $table->dropColumn('filter_policy_type');
            $table->dropColumn('filter_status');
        });
    }
};
