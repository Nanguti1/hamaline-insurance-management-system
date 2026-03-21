<?php

namespace App\Services\Communication;

use App\Models\Client;
use App\Models\CommunicationLog;
use App\Models\Policy;

class CommunicationService
{
    public function sendEmail(?Client $client, ?Policy $policy, string $subject, string $message): CommunicationLog
    {
        return CommunicationLog::create([
            'client_id' => $client?->id,
            'policy_id' => $policy?->id,
            'channel' => 'email',
            'subject' => $subject,
            'message' => $message,
            'recipient' => $client?->email,
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function sendSms(?Client $client, ?Policy $policy, string $message): CommunicationLog
    {
        return CommunicationLog::create([
            'client_id' => $client?->id,
            'policy_id' => $policy?->id,
            'channel' => 'sms',
            'message' => $message,
            'recipient' => $client?->phone,
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }
}
