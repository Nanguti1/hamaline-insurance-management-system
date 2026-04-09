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
        // Medical Policy Details
        Schema::create('medical_policy_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->enum('medical_category', ['A', 'B', 'C', 'D'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Motor Policy Details
        Schema::create('motor_policy_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->enum('vehicle_use', ['private', 'commercial']);
            $table->enum('cover_type', ['third_party', 'comprehensive']);
            $table->enum('private_use_class', ['hire', 'chauffeur', 'taxi_hire', 'taxi_self_drive'])->nullable();
            $table->enum('commercial_class', ['matatu', 'bus', 'truck', 'taxi', 'other'])->nullable();
            $table->decimal('capacity', 10, 2)->nullable(); // cc
            $table->string('capacity_unit', 20)->nullable(); // 'cc'
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // WIBA Policy Details
        Schema::create('wiba_policy_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Policy Members/Employees (for Medical and WIBA)
        Schema::create('policy_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('payroll_number');
            $table->string('id_number');
            $table->string('phone');
            $table->decimal('annual_salary', 12, 2)->nullable();
            $table->string('relationship', 50)->nullable(); // spouse, child, employee, etc.
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Client Documents
        Schema::create('client_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->enum('document_type', ['national_id', 'kra_pin', 'other']);
            $table->string('filename');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->string('file_path');
            $table->boolean('is_required')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policy_members');
        Schema::dropIfExists('client_documents');
        Schema::dropIfExists('wiba_policy_details');
        Schema::dropIfExists('motor_policy_details');
        Schema::dropIfExists('medical_policy_details');
    }
};
