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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('underwriter_id')->constrained()->cascadeOnDelete();

            $table->string('quotation_number', 50)->unique();
            $table->string('status', 30)->default('draft');

            $table->decimal('premium_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('KES');

            $table->date('valid_until');
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
        Schema::dropIfExists('quotations');
    }
};
