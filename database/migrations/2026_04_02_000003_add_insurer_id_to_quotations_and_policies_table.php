<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->foreignId('insurer_id')
                ->nullable()
                ->after('underwriter_id')
                ->constrained('insurers')
                ->nullOnDelete();
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->foreignId('insurer_id')
                ->nullable()
                ->after('underwriter_id')
                ->constrained('insurers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('insurer_id');
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('insurer_id');
        });
    }
};

