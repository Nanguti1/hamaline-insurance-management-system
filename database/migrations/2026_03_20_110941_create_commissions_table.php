<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('underwriter_id')->constrained()->cascadeOnDelete();

            $table->string('commission_number', 50)->unique();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('KES');
            $table->string('status', 30)->default('pending');
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();

            $table->index('status');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
