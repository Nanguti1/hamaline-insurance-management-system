<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('flow', 20)->default('in')->after('policy_id');
            $table->string('proof_file_path')->nullable()->after('notes');
            $table->string('proof_file_name')->nullable()->after('proof_file_path');
            $table->string('proof_mime_type')->nullable()->after('proof_file_name');
            $table->unsignedBigInteger('proof_size')->nullable()->after('proof_mime_type');

            $table->index('flow');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['flow']);
            $table->dropColumn([
                'flow',
                'proof_file_path',
                'proof_file_name',
                'proof_mime_type',
                'proof_size',
            ]);
        });
    }
};
