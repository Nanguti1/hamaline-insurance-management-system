<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wiba_employees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('risk_note_id')->constrained('risk_notes')->cascadeOnDelete();

            // Employee sequence within risk note
            $table->unsignedInteger('employee_sequence')->default(0);

            $table->string('name', 255);
            $table->string('payroll_number', 50);
            $table->string('id_number', 50);
            $table->date('date_of_birth');
            $table->decimal('annual_salary', 14, 2)->default(0);

            $table->timestamps();

            $table->unique(['risk_note_id', 'employee_sequence']);
            $table->index(['risk_note_id', 'payroll_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wiba_employees');
    }
};
