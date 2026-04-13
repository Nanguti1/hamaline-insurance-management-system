<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('binders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('insurer_id')->constrained()->cascadeOnDelete();
            $table->string('line_type', 30)->default('motor');
            $table->string('name', 255);
            $table->string('status', 30)->default('active');
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();

            $table->index(['insurer_id', 'line_type', 'status']);
        });

        Schema::create('binder_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('binder_id')->constrained()->cascadeOnDelete();
            $table->string('version_number', 30);
            $table->boolean('is_active')->default(false);
            $table->date('signed_on')->nullable();
            $table->longText('summary_of_cover')->nullable();
            $table->json('limits_liability')->nullable();
            $table->json('special_clauses')->nullable();
            $table->json('exclusions')->nullable();
            $table->json('premium_rules')->nullable();
            $table->timestamps();

            $table->unique(['binder_id', 'version_number']);
            $table->index(['binder_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('binder_versions');
        Schema::dropIfExists('binders');
    }
};

