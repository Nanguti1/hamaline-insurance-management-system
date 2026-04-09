<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // policy_number was previously NOT NULL. For brokerage capture, it must be nullable.
        DB::statement('ALTER TABLE policies MODIFY policy_number VARCHAR(50) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE policies MODIFY policy_number VARCHAR(50) NOT NULL');
    }
};
