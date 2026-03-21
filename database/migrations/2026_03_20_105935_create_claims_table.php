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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();

            $table->string('claim_number', 50)->unique();
            $table->string('claimant_name', 255);

            $table->date('loss_date');
            $table->date('reported_at');

            $table->decimal('claim_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('KES');
            $table->string('status', 30)->default('submitted');

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
        Schema::dropIfExists('claims');
    }
};
