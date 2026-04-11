<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $core = [
            'CIC',
            'Jubilee',
            'Britam',
            'Pioneer',
        ];

        foreach ($core as $name) {
            DB::table('insurers')->updateOrInsert(
                ['name' => $name],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    public function down(): void
    {
        DB::table('insurers')->whereIn('name', ['CIC', 'Jubilee', 'Britam', 'Pioneer'])->delete();
    }
};
