<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_notes', function (Blueprint $table) {
            $table->id();

            $table->string('line_type', 20);
            $table->string('risk_note_number', 50)->unique();

            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('underwriter_id')->constrained()->cascadeOnDelete();

            // Workflow
            $table->string('status', 30)->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // Period (used by risk-note header)
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Financials (some lines may compute this later)
            $table->decimal('premium_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('KES');

            $table->text('notes')->nullable();
            $table->longText('risk_note_content')->nullable();

            // Link created policy after approval (optional)
            $table->foreignId('policy_id')->nullable()->constrained()->nullOnDelete();

            // RBAC accountability stamps
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index('status');
            $table->index('line_type');
            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_notes');
    }
};

