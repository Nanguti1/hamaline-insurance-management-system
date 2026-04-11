<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_medical_categories', function (Blueprint $table): void {
            $table->string('category_identifier', 120)->nullable()->after('category_name');
        });
    }

    public function down(): void
    {
        Schema::table('client_medical_categories', function (Blueprint $table): void {
            $table->dropColumn('category_identifier');
        });
    }
};
