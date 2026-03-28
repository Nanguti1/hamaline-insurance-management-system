<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->longText('risk_note_content')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn('risk_note_content');
        });
    }
};
