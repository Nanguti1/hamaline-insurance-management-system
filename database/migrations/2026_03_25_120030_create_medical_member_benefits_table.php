<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_member_benefits', function (Blueprint $table) {
            $table->id();

            $table->foreignId('medical_member_id')->constrained('medical_members')->cascadeOnDelete();

            // Benefit toggles: inpatient/outpatient/maternity/dental/optical
            $table->string('benefit_type', 30);
            $table->decimal('amount', 12, 2);

            $table->timestamps();

            $table->unique(['medical_member_id', 'benefit_type']);
            $table->index(['medical_member_id', 'benefit_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_member_benefits');
    }
};

