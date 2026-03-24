<?php

namespace App\Http\Requests\Concerns;

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
        });
    }
}
