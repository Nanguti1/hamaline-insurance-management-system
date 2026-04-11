<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Facades\DB;

trait ValidatesInsurerBelongsToUnderwriter
{
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            if (! $user?->hasRole('underwriter')) {
                return;
            }

            $uwId = $user->underwriterProfile?->id;
            $insurerId = $this->input('insurer_id');

            if (! $uwId || empty($insurerId)) {
                return;
            }

            $allowed = DB::table('insurer_underwriter')
                ->where('underwriter_id', (int) $uwId)
                ->where('insurer_id', (int) $insurerId)
                ->exists();

            if (! $allowed) {
                $validator->errors()->add('insurer_id', 'You may only use insurers linked to your underwriter account.');
            }
        });
    }
}
