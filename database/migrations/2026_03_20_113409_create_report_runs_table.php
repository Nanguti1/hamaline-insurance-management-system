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
        Schema::create('report_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('report_type', 50)->default('overview');
            $table->string('title', 255);
            $table->date('range_start')->nullable();
            $table->date('range_end')->nullable();

            $table->unsignedInteger('active_policies_count')->default(0);
            $table->unsignedInteger('clients_count')->default(0);
            $table->decimal('premium_total', 12, 2)->default(0);
            $table->decimal('claim_total', 12, 2)->default(0);

            $table->timestamp('generated_at')->useCurrent();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('report_type');
            $table->index('generated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_runs');
    }
};
