<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_members', function (Blueprint $table) {
            $table->id();

            $table->foreignId('risk_note_id')->constrained('risk_notes')->cascadeOnDelete();

            // Member sequence: 0 = principal (M), 1 = first additional (M+1), etc.
            $table->unsignedInteger('member_sequence');

            $table->string('member_number', 50)->nullable(); // assigned after approval
            $table->boolean('is_principal')->default(false);

            // Relationship is mandatory for all members
            $table->string('relationship', 20); // principal | spouse | child

            $table->string('name', 255);
            $table->date('date_of_birth');
            $table->string('phone', 50);

            // For most plans: ID number; for juniors: birth certificate number (still keep ID nullable)
            $table->string('id_number', 50)->nullable();
            $table->string('birth_certificate_number', 50)->nullable();

            $table->timestamps();

            $table->unique(['risk_note_id', 'member_sequence']);
            $table->index(['risk_note_id', 'relationship']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_members');
    }
};

