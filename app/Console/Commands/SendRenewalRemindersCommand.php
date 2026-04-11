<?php

namespace App\Console\Commands;

use App\Models\Policy;
use App\Models\Renewal;
use App\Services\Communication\CommunicationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendRenewalRemindersCommand extends Command
{
    protected $signature = 'renewals:send-reminders';

    protected $description = 'Detect 30/60/90-day expiries and send reminders';

    public function handle(CommunicationService $communication): int
    {
        $today = Carbon::today();
        $targets = [30, 60, 90];
        $count = 0;

        $policies = Policy::query()
            ->with('client')
            ->whereIn('status', ['active', 'renewed'])
            ->get();

        foreach ($policies as $policy) {
            if (! $policy->end_date) {
                continue;
            }

            $daysToExpiry = $today->diffInDays(Carbon::parse($policy->end_date), false);
            if (! in_array($daysToExpiry, $targets, true)) {
                continue;
            }

            $renewal = Renewal::query()->firstOrCreate(
                [
                    'policy_id' => $policy->id,
                    'renewal_date' => Carbon::parse($policy->end_date)->toDateString(),
                ],
                [
                    'renewal_number' => 'RN-'.now()->format('YmdHis').'-'.$policy->id,
                    'status' => 'scheduled',
                    'new_end_date' => null,
                    'premium_amount' => $policy->premium_amount,
                    'currency' => $policy->currency,
                    'notes' => "{$daysToExpiry}-day auto reminder schedule",
                ]
            );

            $message = "Your policy {$policy->policy_number} expires in {$daysToExpiry} days ({$policy->end_date}). Please renew in time.";
            $subject = "Policy renewal reminder - {$policy->policy_number}";

            $communication->sendSms($policy->client, $policy, $message);
            $communication->sendEmail($policy->client, $policy, $subject, $message);

            $count++;

            $this->line("Reminder sent for {$policy->policy_number} ({$daysToExpiry} days). Renewal #{$renewal->renewal_number}");
        }

        $this->info("Done. Reminders sent for {$count} policy(ies).");

        return self::SUCCESS;
    }
}
