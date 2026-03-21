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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);

            // Individual fields (nullable for corporate clients)
            $table->string('name')->nullable();
            $table->string('id_number', 50)->nullable()->unique();

            // Corporate fields (nullable for individual clients)
            $table->string('company_name')->nullable();
            $table->string('registration_number', 50)->nullable()->unique();

            $table->string('kra_pin', 50)->nullable();

            // Shared contact fields
            $table->string('phone', 50);
            $table->string('email', 255)->unique();
            $table->text('address');

            $table->text('notes')->nullable();

            $table->index('type');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
