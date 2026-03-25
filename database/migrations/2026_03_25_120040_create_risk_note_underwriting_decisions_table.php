<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_note_underwriting_decisions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('risk_note_id')->constrained('risk_notes')->cascadeOnDelete();

            // Underwriter (linked from risk_note)
            $table->foreignId('underwriter_id')->constrained('underwriters')->cascadeOnDelete();

            // Who made the decision (user account)
            $table->foreignId('decided_by')->constrained('users')->cascadeOnDelete();

            $table->string('decision', 15); // approved | rejected
            $table->text('decision_notes')->nullable();
            $table->timestamp('decided_at')->nullable();

            $table->timestamps();

            $table->index(['risk_note_id', 'decision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_note_underwriting_decisions');
    }
};

