<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_risk_note_details', function (Blueprint $table) {
            $table->foreignId('risk_note_id')
                ->primary()
                ->constrained('risk_notes')
                ->cascadeOnDelete();

            // Medical plan types
            $table->string('plan_type', 20); // individual | junior | corporate

            // Corporate categories A-F (optional / only for corporate plan_type)
            $table->string('corporate_category_code', 5)->nullable();

            // Junior plan: number of children (optional; UI may derive from member list)
            $table->unsignedInteger('junior_children_count')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_risk_note_details');
    }
};

