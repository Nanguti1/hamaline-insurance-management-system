<x-mail::message>
# Quotation {{ $quotation->quotation_number }}

Hello,

Please find your insurance quotation below.

**Premium:** {{ number_format((float) $quotation->premium_amount, 2) }} {{ $quotation->currency }}

**Valid until:** {{ $quotation->valid_until?->format('Y-m-d') }}

@if($quotation->payment_plan === 'installments' && $quotation->installment_count)
**Payment:** {{ $quotation->installment_count }} equal installments of {{ number_format((float) $quotation->premium_amount / $quotation->installment_count, 2) }} {{ $quotation->currency }} each.
@else
**Payment:** One-off payment.
@endif

<x-mail::button :url="url('/quotations/'.$quotation->id)">
View quotation
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
