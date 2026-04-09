<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'document_type',
        'filename',
        'original_filename',
        'mime_type',
        'size',
        'file_path',
        'is_required',
    ];

    protected $casts = [
        'document_type' => 'string',
        'size' => 'integer',
        'is_required' => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function getRequiredDocumentTypes(): array
    {
        return ['national_id', 'kra_pin'];
    }

    public function isRequiredDocument(): bool
    {
        return in_array($this->document_type, $this->getRequiredDocumentTypes());
    }
}
