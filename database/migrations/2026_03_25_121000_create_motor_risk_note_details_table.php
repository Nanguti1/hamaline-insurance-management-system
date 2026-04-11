<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motor_risk_note_details', function (Blueprint $table) {
            $table->foreignId('risk_note_id')
                ->primary()
                ->constrained('risk_notes')
                ->cascadeOnDelete();

            // Insured details
            $table->string('insured_name', 255);
            $table->string('insured_id_number', 50);
            $table->string('insured_phone', 50);
            $table->string('insured_email', 255);
            $table->text('insured_postal_address');

            // Vehicle details
            $table->string('registration_number', 50);
            $table->string('make_model', 255);
            $table->unsignedInteger('year_of_manufacture');
            $table->string('chassis_number', 100);
            $table->string('engine_number', 100);
            $table->string('body_type', 50);
            $table->string('vehicle_use', 20); // private | commercial

            // Insurance cover
            $table->string('cover_type', 40); // third_party_only | third_party_fire_theft | comprehensive
            $table->decimal('sum_insured', 14, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motor_risk_note_details');
    }
};
