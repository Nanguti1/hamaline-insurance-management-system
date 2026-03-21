<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\StorePaymentRequest;
use App\Http\Requests\Payments\UpdatePaymentRequest;
use App\Models\Payment;
use App\Models\Policy;
use App\Services\Payments\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request, PaymentService $service): Response
    {
        $payments = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('payments/create', [
            'policies' => Policy::query()
                ->orderBy('policy_number')
                ->get(['id', 'policy_number']),
        ]);
    }

    public function store(StorePaymentRequest $request, PaymentService $service): RedirectResponse
    {
        $payment = $service->create($request->validated());
        return to_route('payments.show', $payment);
    }

    public function show(Payment $payment): Response
    {
        return Inertia::render('payments/show', [
            'payment' => $payment->load(['policy.client', 'policy.underwriter']),
        ]);
    }

    public function edit(Payment $payment): Response
    {
        return Inertia::render('payments/edit', [
            'payment' => $payment->load(['policy.client', 'policy.underwriter']),
            'policies' => Policy::query()
                ->orderBy('policy_number')
                ->get(['id', 'policy_number']),
        ]);
    }

    public function update(
        UpdatePaymentRequest $request,
        Payment $payment,
        PaymentService $service
    ): RedirectResponse {
        $service->update($payment, $request->validated());
        return to_route('payments.show', $payment);
    }

    public function destroy(Payment $payment, PaymentService $service): RedirectResponse
    {
        $service->delete($payment);
        return to_route('payments.index');
    }
}

