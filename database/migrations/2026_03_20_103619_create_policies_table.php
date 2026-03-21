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
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('underwriter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();

            $table->string('policy_number', 50)->unique();
            $table->string('policy_type', 100)->nullable();
            $table->string('status', 30)->default('active');

            $table->date('start_date');
            $table->date('end_date');

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
        Schema::dropIfExists('policies');
    }
};
