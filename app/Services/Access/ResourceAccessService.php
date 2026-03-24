<?php

namespace App\Services\Access;

use App\Models\Claim;
use App\Models\Commission;
use App\Models\Payment;
use App\Models\Policy;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ResourceAccessService
{
    public function assertCanViewPolicy(?User $user, Policy $policy): void
    {
        abort_unless($this->canViewPolicy($user, $policy), 403);
    }

    public function assertCanViewQuotation(?User $user, Quotation $quotation): void
    {
        abort_unless($this->canViewQuotation($user, $quotation), 403);
    }

    public function assertCanViewClaim(?User $user, Claim $claim): void
    {
        abort_unless($this->canViewClaim($user, $claim), 403);
    }

    public function assertCanViewPayment(?User $user, Payment $payment): void
    {
        abort_unless($this->canViewPayment($user, $payment), 403);
    }

    public function canViewPolicy(?User $user, Policy $policy): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;

            return $clientId && (int) $policy->client_id === (int) $clientId;
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;

            return $uwId && (int) $policy->underwriter_id === (int) $uwId;
        }

        return $user->can('policies.view');
    }

    public function canViewQuotation(?User $user, Quotation $quotation): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;

            return $uwId && (int) $quotation->underwriter_id === (int) $uwId;
        }

        return $user->can('quotations.view');
    }

    public function canViewClaim(?User $user, Claim $claim): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('client')) {
            $policy = $claim->relationLoaded('policy') ? $claim->policy : $claim->policy()->first();

            return $policy && $this->canViewPolicy($user, $policy);
        }

        if ($user->hasRole('claims_officer')) {
            return (int) $claim->assigned_to === (int) $user->id;
        }

        return $user->can('claims.view');
    }

    public function canViewPayment(?User $user, Payment $payment): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('finance_officer')) {
            return $user->can('payments.view');
        }

        if ($user->hasRole('client')) {
            $policy = $payment->relationLoaded('policy') ? $payment->policy : $payment->policy()->first();

            return $policy && $this->canViewPolicy($user, $policy);
        }

        return $user->can('payments.view');
    }

    /**
     * @param  Builder<Policy>  $query
     * @return Builder<Policy>
     */
    public function scopePoliciesQuery(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('admin')) {
            return $query;
        }

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;

            return $clientId
                ? $query->where('client_id', $clientId)
                : $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;

            return $uwId
                ? $query->where('underwriter_id', $uwId)
                : $query->whereRaw('0 = 1');
        }

        return $query->whereRaw('0 = 1');
    }

    /**
     * @param  Builder<Quotation>  $query
     * @return Builder<Quotation>
     */
    public function scopeQuotationsQuery(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('admin')) {
            return $query;
        }

        if ($user->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;

            return $uwId
                ? $query->where('underwriter_id', $uwId)
                : $query->whereRaw('0 = 1');
        }

        return $query->whereRaw('0 = 1');
    }

    /**
     * @param  Builder<Claim>  $query
     * @return Builder<Claim>
     */
    public function scopeClaimsQuery(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('admin')) {
            return $query;
        }

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;

            return $clientId
                ? $query->whereHas('policy', fn (Builder $p) => $p->where('client_id', $clientId))
                : $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('claims_officer')) {
            return $query->where('assigned_to', $user->id);
        }

        return $query->whereRaw('0 = 1');
    }

    /**
     * @param  Builder<Payment>  $query
     * @return Builder<Payment>
     */
    public function scopePaymentsQuery(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('admin')) {
            return $query;
        }

        if ($user->hasRole('finance_officer')) {
            return $query;
        }

        if ($user->hasRole('client')) {
            $clientId = $user->clientRecord?->id;

            return $clientId
                ? $query->whereHas('policy', fn (Builder $p) => $p->where('client_id', $clientId))
                : $query->whereRaw('0 = 1');
        }

        return $query->whereRaw('0 = 1');
    }

    /**
     * @param  Builder<Commission>  $query
     * @return Builder<Commission>
     */
    public function scopeCommissionsQuery(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->hasRole('admin') || $user->hasRole('finance_officer')) {
            return $query;
        }

        return $query->whereRaw('0 = 1');
    }

    /**
     * Policies available when creating/editing claims (no policies.view route for claims officers).
     *
     * @return Collection<int, Policy>
     */
    public function policiesForClaimForm(?User $user): Collection
    {
        if (! $user) {
            return Policy::query()->whereRaw('0 = 1')->get();
        }

        if ($user->hasRole('admin')) {
            return Policy::query()->orderBy('policy_number')->get(['id', 'policy_number']);
        }

        if ($user->hasRole('claims_officer') && $user->can('claims.manage')) {
            return Policy::query()->orderBy('policy_number')->get(['id', 'policy_number']);
        }

        return Policy::query()->whereRaw('0 = 1')->get();
    }
}
