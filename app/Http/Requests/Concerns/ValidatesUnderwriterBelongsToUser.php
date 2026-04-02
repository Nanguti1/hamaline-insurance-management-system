<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Facades\DB;

trait ValidatesUnderwriterBelongsToUser
{
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            if (! $user?->hasRole('underwriter')) {
                return;
            }

            $uwId = $user->underwriterProfile?->id;
            if (! $uwId || (int) $this->input('underwriter_id') !== (int) $uwId) {
                $validator->errors()->add('underwriter_id', 'You may only use your linked underwriter account.');
            }

            // If an insurer is selected, ensure it's within the underwriter's allowed insurers.
            $insurerId = $this->input('insurer_id');
            if (! empty($insurerId) && $uwId) {
                $allowed = DB::table('insurer_underwriter')
                    ->where('underwriter_id', (int) $uwId)
                    ->where('insurer_id', (int) $insurerId)
                    ->exists();

                if (! $allowed) {
                    $validator->errors()->add('insurer_id', 'You may only use insurers linked to your underwriter account.');
                }
            }
        });
    }
}
