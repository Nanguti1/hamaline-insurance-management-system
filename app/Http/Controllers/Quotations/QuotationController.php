<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotations\StoreQuotationRequest;
use App\Http\Requests\Quotations\UpdateQuotationRequest;
use App\Mail\QuotationIssuedMail;
use App\Models\Client;
use App\Models\Insurer;
use App\Models\Quotation;
use App\Models\Underwriter;
use App\Services\Access\ResourceAccessService;
use App\Services\Quotations\QuotationService;
use Dompdf\Dompdf;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(
        private ResourceAccessService $access,
    ) {}

    public function index(Request $request, QuotationService $service): Response
    {
        $quotations = $service->paginate([
            'q' => $request->query('q'),
            'status' => $request->query('status'),
        ]);

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
            'filters' => [
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('quotations/create', [
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
        ]);
    }

    public function store(StoreQuotationRequest $request, QuotationService $service): RedirectResponse
    {
        $quotation = $service->create($request->validated());
        $quotation->load(['client', 'underwriter']);

        $email = $quotation->client?->email;
        if ($quotation->status === 'issued' && is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Mail::to($email)->send(new QuotationIssuedMail($quotation));
        }

        return to_route('quotations.show', $quotation)->with('success', 'Quotation created successfully.');
    }

    public function suggestions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'underwriter_id' => ['required', 'integer', 'exists:underwriters,id'],
            'insurer_id' => ['required', 'integer', 'exists:insurers,id'],
            'policy_type' => ['required', 'string', 'in:motor,medical,wiba'],
        ]);

        $user = $request->user();
        if ($user?->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if (! $uwId || (int) $data['underwriter_id'] !== (int) $uwId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $allowed = DB::table('insurer_underwriter')
            ->where('underwriter_id', (int) $data['underwriter_id'])
            ->where('insurer_id', (int) $data['insurer_id'])
            ->exists();
        if (! $allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $latest = Quotation::query()
            ->where('client_id', (int) $data['client_id'])
            ->where('underwriter_id', (int) $data['underwriter_id'])
            ->where('insurer_id', (int) $data['insurer_id'])
            ->where('policy_type', (string) $data['policy_type'])
            ->orderByDesc('id')
            ->first();

        $client = $latest?->client ?? Client::query()->find($data['client_id']);
        $underwriter = $latest?->underwriter ?? Underwriter::query()->find($data['underwriter_id']);

        $fallbackNotes = trim(implode("\n", array_filter([
            $client?->notes,
            $underwriter?->notes,
        ])));

        return response()->json([
            'premium_amount' => $latest?->premium_amount,
            'currency' => $latest?->currency,
            'valid_until' => $latest?->valid_until?->format('Y-m-d'),
            'notes' => $latest?->notes ?? ($fallbackNotes !== '' ? $fallbackNotes : null),
            'payment_plan' => $latest?->payment_plan ?? 'one_off',
            'installment_count' => $latest?->installment_count,
            'policy_type' => $latest?->policy_type ?? $data['policy_type'],
        ]);
    }

    public function show(Quotation $quotation): Response
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        return Inertia::render('quotations/show', [
            'quotation' => $quotation->load(['client', 'underwriter', 'insurer']),
        ]);
    }

    public function downloadPDF(Quotation $quotation)
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);
        $quotation->loadMissing(['client', 'insurer']);

        $html = $this->buildQuotationPdfHtml($quotation);
        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->stream("{$quotation->quotation_number}.pdf");
    }

    public function edit(Quotation $quotation): Response
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation->load(['client', 'underwriter', 'insurer']),
            'clients' => Client::query()
                ->orderBy('name')
                ->get(['id', 'name', 'company_name']),
            'underwriters' => $this->underwriterSelectOptionsWithInsurers(),
            'insurers' => $this->insurerSelectOptions(),
        ]);
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation, QuotationService $service): RedirectResponse
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        $previousStatus = $quotation->status;
        $service->update($quotation, $request->validated());

        if ($previousStatus !== 'issued' && $quotation->status === 'issued') {
            $quotation->loadMissing(['client']);
            $email = $quotation->client?->email;
            if (is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Mail::to($email)->send(new QuotationIssuedMail($quotation->fresh(['client'])));
            }
        }

        return to_route('quotations.show', $quotation)->with('success', 'Quotation updated successfully.');
    }

    public function destroy(Quotation $quotation, QuotationService $service): RedirectResponse
    {
        $this->access->assertCanViewQuotation(auth()->user(), $quotation);

        $service->delete($quotation);

        return to_route('quotations.index');
    }

    /**
     * @return Collection<int, Underwriter>
     */
    private function underwriterSelectOptionsWithInsurers()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            return Underwriter::query()
                ->where('user_id', $user->id)
                ->with(['insurers:id,name'])
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Underwriter::query()
            ->with(['insurers:id,name'])
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return Collection<int, Insurer>
     */
    private function insurerSelectOptions()
    {
        $user = auth()->user();
        if ($user?->hasRole('underwriter')) {
            $uwId = $user->underwriterProfile?->id;
            if (! $uwId) {
                return collect();
            }

            return Insurer::query()
                ->whereIn('id', function ($q) use ($uwId) {
                    $q->select('insurer_id')
                        ->from('insurer_underwriter')
                        ->where('underwriter_id', (int) $uwId);
                })
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Insurer::query()->orderBy('name')->get(['id', 'name']);
    }

    private function buildQuotationPdfHtml(Quotation $quotation): string
    {
        $client = $quotation->client?->name ?? $quotation->client?->company_name ?? '-';
        $sumInsured = (float) ($quotation->sum_insured ?? $quotation->premium_amount ?? 0);
        $basePremium = (float) ($quotation->quoted_base_premium ?? $quotation->premium_amount ?? 0);
        $trainingLevy = (float) ($quotation->quoted_training_levy ?? round($basePremium * 0.002, 2));
        $phcf = (float) ($quotation->quoted_phcf ?? round($basePremium * 0.0025, 2));
        $stampDuty = (float) ($quotation->quoted_stamp_duty ?? 40);
        $totalPremium = (float) ($quotation->quoted_total_premium ?? ($basePremium + $trainingLevy + $phcf + $stampDuty));
        $quotedOn = $quotation->quoted_on?->format('d/m/Y') ?? now()->format('d/m/Y');
        $preparedBy = $quotation->prepared_by ?? 'Prepared Officer';
        $reviewedBy = $quotation->reviewed_by ?? 'Reviewed Officer';
        $registration = $quotation->registration_number ?? '-';
        $makeModel = $quotation->vehicle_make_model ?? '-';
        $vehicleClass = $quotation->vehicle_class ?? 'MOTOR PRIVATE';
        $yom = $quotation->year_of_manufacture ?? '-';
        $interestsInsured = $quotation->interests_insured ?? 'No blame no excess';
        $excessRemarks = $quotation->excess_remarks ?? 'Accidental damage 2.5% of value min 20,000';
        $insurer = $quotation->insurer?->name ?? 'INSURER';
        $quotationTitle = match (strtolower((string) $quotation->policy_type)) {
            'medical' => 'Medical Insurance Quotation',
            'wiba' => 'WIBA Insurance Quotation',
            default => 'Motor Private Insurance Quotation',
        };
        $logoPath = public_path('hamaline-logo.png');
        $logoDataUri = null;
        if (is_file($logoPath)) {
            $raw = @file_get_contents($logoPath);
            if ($raw !== false) {
                $mime = mime_content_type($logoPath) ?: 'image/png';
                $logoDataUri = 'data:'.$mime.';base64,'.base64_encode($raw);
            }
        }

        $interestsInsuredHtml = $this->formatMultilineForHtml($interestsInsured);
        $excessRemarksHtml = $this->formatMultilineForHtml($excessRemarks);
        $makeModelHtml = e($makeModel);
        $registrationHtml = e($registration);
        $vehicleClassHtml = e($vehicleClass);
        $clientHtml = e($client);
        $preparedByHtml = e($preparedBy);
        $reviewedByHtml = e($reviewedBy);
        $insurerHtml = e($insurer);
        $yomHtml = e((string) $yom);
        $logoHtml = $logoDataUri !== null
            ? "<img src=\"{$logoDataUri}\" alt=\"Hamaline Insurance Agency\" class=\"header-logo\" />"
            : '<div class="header-logo-fallback">Hamaline Insurance Agency</div>';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{font-family: DejaVu Sans, Arial, sans-serif; font-size:14px; color:#111; margin:12px;}
.header{border:1px solid #000; text-align:center; padding:8px 8px; font-weight:700;}
.header-logo{height:62px; width:auto; max-width:260px; margin:0 auto 6px auto; display:block; object-fit:contain;}
.header-logo-fallback{font-size:20px; font-weight:700; margin-bottom:6px;}
.header-title{font-size:34px; color:#b3202e; margin:0;}
.header-meta{margin:2px 0; font-size:14px;}
.header-sub{margin:2px 0 0 0;}
table{width:100%; border-collapse:collapse;}
th,td{border:1px solid #222; vertical-align:top; padding:6px;}
th{background:#f1f1f1; text-align:left;}
.num{text-align:right;}
.nowrap{white-space:nowrap;}
.yellow{background:#062e4a; border:1px solid #062e4a; border-radius:2px; margin-top:0; padding:8px 12px; color:#fff;}
.yellow td{border:none; padding:2px 6px;}
.contact-meta{font-size:11px; margin:2px 0;}
</style>
</head>
<body>
    <div class="header">
        {$logoHtml}
        <div class="contact-meta">Phone Number: +254 713619381</div>
        <div class="contact-meta">Email: info@hamalineagency.co.ke</div>
        <div class="header-title">{$insurerHtml}</div>
        <div class="header-meta">Hamaline Insurance Agency</div>
        <div class="header-sub">Insured: {$clientHtml}</div>
        <div class="header-sub">{$quotationTitle}</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>CLASS</th>
                <th>INTERESTS INSURED</th>
                <th>SUMS INSURED</th>
                <th>PREMIUM</th>
                <th>EXCESS / REMARKS</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>{$vehicleClassHtml}</strong><br/>Make: {$makeModelHtml}<br/>Y.O.M {$yomHtml}</td>
                <td>Registration {$registrationHtml}<br/><br/>{$interestsInsuredHtml}</td>
                <td class="num"><strong>{$this->formatMoney($sumInsured)}</strong><br/><br/>Training Levy<br/>PHCF<br/>Stamp Duty</td>
                <td class="num">{$this->formatMoney($basePremium)}<br/><br/>{$this->formatMoney($trainingLevy)}<br/>{$this->formatMoney($phcf)}<br/>{$this->formatMoney($stampDuty)}</td>
                <td>{$excessRemarksHtml}</td>
            </tr>
            <tr>
                <td colspan="3"><strong>Total Premium</strong></td>
                <td class="num"><strong>{$this->formatMoney($totalPremium)}</strong></td>
                <td></td>
            </tr>
        </tbody>
    </table>
    <div class="yellow">
        <table>
            <tr><td colspan="3"><strong>Subject to underwriter Policy, Terms and condition.</strong></td></tr>
            <tr><td class="nowrap"><strong>SIGNATURE :</strong> _____________________</td><td><strong>PREPARED BY:</strong> {$preparedByHtml}</td><td><strong>REVIEWED BY:</strong> {$reviewedByHtml}</td></tr>
            <tr><td></td><td>{$quotedOn}</td><td>{$quotedOn}</td></tr>
            <tr><td colspan="3"><strong>{$insurerHtml}</strong></td></tr>
        </table>
    </div>
</body>
</html>
HTML;
    }

    private function formatMoney(float $amount): string
    {
        return number_format($amount, 2);
    }

    private function formatMultilineForHtml(string $value): string
    {
        $lines = preg_split('/\R/u', trim($value)) ?: [];
        $cleanLines = array_values(array_filter(array_map(static fn (string $line): string => trim($line), $lines), static fn (string $line): bool => $line !== ''));
        if ($cleanLines === []) {
            return '-';
        }

        return implode('<br/>', array_map(static fn (string $line): string => e($line), $cleanLines));
    }
}
