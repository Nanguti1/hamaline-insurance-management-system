<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('underwriters', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
        });

        foreach (['quotations', 'policies', 'claims', 'payments', 'commissions'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }

        Schema::table('claims', function (Blueprint $table) {
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('commissions', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('underwriter_id')->constrained('users')->nullOnDelete();
        });

        $roleRenames = [
            'Admin' => 'admin',
            'Agent' => 'underwriter',
            'Claims Officer' => 'claims_officer',
        ];

        foreach ($roleRenames as $from => $to) {
            DB::table('roles')
                ->where('guard_name', 'web')
                ->where('name', $from)
                ->update(['name' => $to, 'updated_at' => now()]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $roleRenames = [
            'admin' => 'Admin',
            'underwriter' => 'Agent',
            'claims_officer' => 'Claims Officer',
        ];

        foreach ($roleRenames as $from => $to) {
            DB::table('roles')
                ->where('guard_name', 'web')
                ->where('name', $from)
                ->update(['name' => $to, 'updated_at' => now()]);
        }

        Schema::table('commissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('received_by');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_to');
        });

        foreach (['commissions', 'payments', 'claims', 'policies', 'quotations'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('approved_by');
                $table->dropConstrainedForeignId('updated_by');
                $table->dropConstrainedForeignId('created_by');
            });
        }

        Schema::table('underwriters', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
