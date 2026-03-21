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
        Schema::create('renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();

            $table->string('renewal_number', 50)->unique();
            $table->string('status', 30)->default('scheduled');
            $table->date('renewal_date');
            $table->date('new_end_date')->nullable();

            $table->decimal('premium_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('KES');
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
        Schema::dropIfExists('renewals');
    }
};
