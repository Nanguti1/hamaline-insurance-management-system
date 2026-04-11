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
        Schema::table('risk_notes', function (Blueprint $table) {
            $table->foreignId('insurer_id')->nullable()->constrained()->after('underwriter_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('risk_notes', function (Blueprint $table) {
            $table->dropForeign(['insurer_id']);
            $table->dropColumn('insurer_id');
        });
    }
};
