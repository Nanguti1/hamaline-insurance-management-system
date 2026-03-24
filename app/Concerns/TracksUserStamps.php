<?php

namespace App\Concerns;

trait TracksUserStamps
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function withCreateAudit(array $data): array
    {
        if ($id = auth()->id()) {
            $data['created_by'] = $id;
            $data['updated_by'] = $id;
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function withUpdateAudit(array $data): array
    {
        if ($id = auth()->id()) {
            $data['updated_by'] = $id;
        }

        return $data;
    }
}
