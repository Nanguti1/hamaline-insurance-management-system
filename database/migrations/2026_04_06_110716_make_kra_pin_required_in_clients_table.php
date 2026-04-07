<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // First, update any NULL values to empty string to avoid constraint violations
            DB::statement("UPDATE clients SET kra_pin = '' WHERE kra_pin IS NULL");

            // Then make the column NOT NULL
            $table->string('kra_pin', 50)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('kra_pin', 50)->nullable()->change();
        });
    }
};
