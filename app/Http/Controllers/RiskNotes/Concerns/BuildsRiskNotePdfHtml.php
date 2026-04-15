<?php

namespace App\Http\Controllers\RiskNotes\Concerns;

trait BuildsRiskNotePdfHtml
{
    protected function buildRiskNotePdfHtml(string $content, string $type, string $riskNoteNumber, string $insurerName): string
    {
        if (strtolower($type) === 'motor') {
            return $this->buildMotorRiskNotePdfHtml($content);
        }

        $formattedContent = $this->formatRiskNoteContent($content);
        $intermediary = 'Hamaline Insurance Agency (Intermediary)';
        $logoDataUri = $this->resolvePdfLogoDataUri();
        $logoHtml = $logoDataUri !== null
            ? "<img src=\"{$logoDataUri}\" alt=\"Hamaline Insurance Agency\" class=\"brand-logo\" />"
            : '<div class="brand-logo-fallback">Hamaline Insurance Agency</div>';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{$riskNoteNumber}</title>
    <style>
        @page {
            margin: 6mm;
            size: A4 portrait;
        }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #111827;
            margin: 0;
            padding: 0;
            background: #ffffff;
        }
        .page {
            background: #ffffff;
            border: 1px solid #d6dee8;
            border-radius: 8px;
            padding: 8px;
        }
        .header {
            background: #062e4a;
            color: #ffffff;
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        .header-row {
            width: 100%;
        }
        .header-row td {
            vertical-align: middle;
        }
        .header-copy {
            text-align: right;
        }
        .brand-logo {
            height: 34px;
            width: auto;
            max-width: 140px;
            display: block;
            background: #ffffff;
            border-radius: 6px;
            padding: 3px 6px;
        }
        .brand-logo-fallback {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2px;
        }
        .header h1 {
            margin: 0 0 2px 0;
            font-size: 14px;
            letter-spacing: 0.2px;
        }
        .header-meta {
            margin: 0;
            font-size: 8px;
            opacity: 0.95;
        }
        .meta-grid {
            margin-top: 5px;
            font-size: 8px;
        }
        .section-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px 6px;
            margin-left: -6px;
            margin-right: -6px;
        }
        .section-col {
            width: 50%;
            vertical-align: top;
        }
        .section-stack .section-card {
            margin-bottom: 6px;
        }
        .section-stack .section-card:last-child {
            margin-bottom: 0;
        }
        .section-card {
            border: 1px solid #dbe5ef;
            border-radius: 6px;
            background: #f8fbff;
            padding: 7px;
            page-break-inside: avoid;
        }
        .section-card h2 {
            color: #062e4a;
            font-size: 11px;
            margin: 0 0 6px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #062e4a;
        }
        .info-row {
            font-size: 9px;
            margin-bottom: 4px;
            line-height: 1.2;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            color: #062e4a;
            font-weight: 700;
        }
        .section-card-conditions {
            background: #edf4f8;
            border-left: 4px solid #062e4a;
        }
        .section-card-notes {
            background: #fef9c3;
            border-left: 4px solid #f59e0b;
        }
        .styled-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 8px;
        }
        .styled-table th,
        .styled-table td {
            border: 1px solid #dbeafe;
            padding: 4px;
            text-align: left;
            vertical-align: top;
        }
        .styled-table th {
            background: #062e4a;
            color: #ffffff;
            font-weight: 700;
        }
        .bullet-list {
            margin: 0;
            padding-left: 12px;
        }
        .bullet-list li {
            margin-bottom: 2px;
            line-height: 1.2;
        }
        p {
            margin: 0 0 4px 0;
        }
        p:last-child {
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <table class="header-row" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td>{$logoHtml}</td>
                    <td class="header-copy">
                        <h1>{$type} Risk Note</h1>
                        <p class="header-meta">{$intermediary}</p>
                        <div class="meta-grid">
                            <div><strong>Risk Note:</strong> {$riskNoteNumber}</div>
                            <div><strong>Insurer:</strong> {$insurerName}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        {$formattedContent}
    </div>
</body>
</html>
HTML;
    }

    protected function buildMotorRiskNotePdfHtml(string $content): string
    {
        $sections = $this->parseRiskNoteSections($content);
        $header = $sections['Header']['kv'] ?? [];
        $insured = $sections['Insured Information']['kv'] ?? [];
        $vehicle = $sections['Vehicle Details']['kv'] ?? [];
        $cover = $sections['Insurance Cover']['kv'] ?? [];
        $limitsRows = $sections['Limits of Liability']['table_rows'] ?? [];
        $financials = $sections['Financials']['kv'] ?? [];
        $conditions = $sections['Conditions']['bullets'] ?? [];
        $exclusions = $sections['Exclusions']['bullets'] ?? [];
        $notes = $sections['Notes']['bullets'] ?? [];

        $premiumPayable = $this->normalizeCurrencyNumber($financials['Premium Payable'] ?? null);
        $phcf = $this->normalizeCurrencyNumber($financials['Policyholders Fund'] ?? null);
        if ($phcf <= 0) {
            $phcf = round($premiumPayable * 0.0025, 2);
        }
        $trainingLevy = $this->normalizeCurrencyNumber($financials['Training Levy'] ?? null);
        if ($trainingLevy <= 0) {
            $trainingLevy = round($premiumPayable * 0.002, 2);
        }
        $stampDuty = 40.00;
        $basicPremium = $this->normalizeCurrencyNumber($financials['Time on Risk Total Premium'] ?? null);
        if ($basicPremium <= 0) {
            $basicPremium = round($premiumPayable - ($phcf + $trainingLevy + $stampDuty), 2);
        }
        $timeOnRiskPremium = $this->normalizeCurrencyNumber($financials['Time on Risk Premium'] ?? null);
        $firstPremiumTotal = $this->normalizeCurrencyNumber($financials['First Premium Total'] ?? null);

        $policyDetails = [
            'Insurer' => $header['Insurer'] ?? '-',
            'Insurer Policy No.' => $header['Insurer Policy Number'] ?? '-',
            'Internal Policy No.' => $header['Internal Policy Number'] ?? '-',
            'Binder Name' => $header['Binder Name'] ?? '-',
            'Risk Note No.' => $header['Risk Note Number'] ?? '-',
            'Currency' => $header['Currency'] ?? 'KES',
        ];
        $insurerName = (string) ($policyDetails['Insurer'] ?? '');
        $insurerLogoDataUri = $this->resolveInsurerLogoDataUri($insurerName);
        $headerLogoHtml = $insurerLogoDataUri !== null
            ? '<img src="'.$insurerLogoDataUri.'" alt="'.e($insurerName).' logo" class="header-logo" />'
            : '<div class="header-logo-fallback">'.e($insurerName !== '' ? $insurerName : 'INSURER').'</div>';

        $clientDetails = [
            'Customer ID' => $insured['Customer ID'] ?? '-',
            'Policy Holder' => $insured['Name'] ?? '-',
            'Postal Address' => $insured['Postal Address'] ?? '-',
            'Mobile' => $insured['Mobile'] ?? '-',
            'Tel (Others)' => $insured['Tel (Others)'] ?? '-',
            'Email' => $insured['Email'] ?? '-',
            'PIN No.' => $insured['PIN Number'] ?? '-',
        ];

        $periodText = $insured['Period of Insurance'] ?? '-';
        $periodParts = array_map('trim', explode('-', $periodText, 2));
        $coverFrom = $periodParts[0] ?? '-';
        $coverTo = $periodParts[1] ?? '-';
        $riskPeriodText = $insured['Time on Risk'] ?? '-';
        $riskPeriodParts = array_map('trim', explode('-', $riskPeriodText, 2));
        $riskFrom = $riskPeriodParts[0] ?? '-';
        $riskTo = $riskPeriodParts[1] ?? '-';

        $coverType = $cover['Cover Type'] ?? '-';
        $riskNoteTitle = stripos($coverType, 'Third Party') !== false
            ? 'Motor Third Party Risk Note'
            : 'Motor Private Insurance Risk Note';
        $coverDescription = 'Comprehensive - accidental loss or damage to insured motor vehicle and third party liabilities.';
        if (stripos($coverType, 'Third Party') !== false) {
            $coverDescription = 'Third Party cover - liabilities for death, bodily injury or damage to third party property.';
        }

        $limitsBodyRows = '';
        foreach ($limitsRows as $row) {
            $description = e($row[0] ?? '-');
            $limit = e($row[1] ?? '-');
            $excess = e($row[2] ?? '-');
            $limitsBodyRows .= "<tr><td>{$description}</td><td>{$limit}</td><td>{$excess}</td></tr>";
        }

        if ($limitsBodyRows === '') {
            $limitsBodyRows = '<tr><td>-</td><td>-</td><td>-</td></tr>';
        }

        $conditionsText = e(implode(' | ', $conditions));
        $exclusionsText = e(implode(' | ', $exclusions));
        $paymentMethod = e($this->extractNoteValue($notes, 'Payment Method') ?? '-');
        $issuingOfficer = e($this->extractNoteValue($notes, 'Issuing Officer') ?? '-');
        $vehicleRegistration = $this->valueOrDash($vehicle['Registration Number'] ?? null);

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Motor Risk Note</title>
    <style>
        @page {
            margin: 8mm;
            size: A4 portrait;
        }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 10px;
            color: #111111;
            margin: 0;
        }
        .header-box {
            text-align: center;
            margin-bottom: 8px;
            padding: 8px 10px 10px 10px;
        }
        .header-logo {
            height: 56px;
            width: 220px;
            margin: 0 auto 4px auto;
            display: block;
            border-radius: 5px;
            object-fit: contain;
        }
        .header-logo-fallback {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #a11d2f;
            margin-bottom: 4px;
        }
        .header-insurer {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            color: #a11d2f;
        }
        .header-address {
            margin: 2px 0 0 0;
            font-size: 11px;
        }
        .header-agency {
            margin: 4px 0 0 0;
            font-size: 12px;
            font-weight: 700;
        }
        .header-product {
            margin: 1px 0 0 0;
            font-size: 12px;
            font-weight: 700;
        }
        .details-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .header-divider {
            border-top: 1px solid #1f2937;
            margin: 0 0 8px 0;
        }
        .details-grid td {
            padding: 2px 4px;
            vertical-align: top;
            font-size: 10px;
        }
        .label {
            width: 95px;
            color: #333333;
        }
        .heading {
            font-size: 14px;
            font-weight: 700;
            padding: 0 0 3px 0;
        }
        .cover-text {
            margin: 0 0 8px 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9px;
        }
        .table th,
        .table td {
            border: 1px solid #c6c6c6;
            padding: 3px 4px;
            vertical-align: top;
        }
        .table th {
            background: #efefef;
            font-weight: 700;
            text-align: left;
        }
        .row-heading {
            font-weight: 700;
            margin-top: 6px;
            margin-bottom: 2px;
        }
        .signatures {
            background: #f4be00;
            border: 1px solid #d29e00;
            margin-top: 6px;
        }
        .signatures td {
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header-box">
        {$headerLogoHtml}
        <p class="header-insurer">{$this->valueOrDash($insurerName)}</p>
        <p class="header-address">Tel: {$this->valueOrDash($insured['Tel (Others)'] ?? null)} &nbsp; Email: {$this->valueOrDash($insured['Email'] ?? null)}</p>
        <p class="header-agency">Hamaline Insurance Agency - Registration {$vehicleRegistration}</p>
        <p class="header-product">{$riskNoteTitle}</p>
    </div>
    <div class="header-divider"></div>

    <div class="heading">POLICY DETAILS</div>
    <table class="details-grid">
        <tr><td class="label">Insurer:</td><td>{$policyDetails['Insurer']}</td><td class="label">Risk Note No.</td><td>{$policyDetails['Risk Note No.']}</td></tr>
        <tr><td class="label">Insurer Policy No.</td><td>{$policyDetails['Insurer Policy No.']}</td><td class="label">Currency</td><td>{$policyDetails['Currency']}</td></tr>
        <tr><td class="label">Internal Policy No.</td><td>{$policyDetails['Internal Policy No.']}</td><td class="label"></td><td></td></tr>
        <tr><td class="label">Binder Name</td><td>{$policyDetails['Binder Name']}</td><td class="label"></td><td></td></tr>
    </table>

    <div class="heading">CLIENT DETAILS</div>
    <table class="details-grid">
        <tr><td class="label">Customer ID</td><td>{$clientDetails['Customer ID']}</td><td class="label">Mobile</td><td>{$clientDetails['Mobile']}</td></tr>
        <tr><td class="label">Policy Holder</td><td>{$clientDetails['Policy Holder']}</td><td class="label">Tel (Others)</td><td>{$clientDetails['Tel (Others)']}</td></tr>
        <tr><td class="label">Postal Address</td><td>{$clientDetails['Postal Address']}</td><td class="label">Email</td><td>{$clientDetails['Email']}</td></tr>
        <tr><td class="label">PIN No.</td><td>{$clientDetails['PIN No.']}</td><td class="label"></td><td></td></tr>
    </table>

    <div class="heading">PERIOD OF INSURANCE</div>
    <table class="details-grid">
        <tr><td class="label">Cover From</td><td>{$coverFrom}</td><td class="label">Cover To</td><td>{$coverTo}</td></tr>
        <tr><td class="label">Time on Risk From</td><td>{$riskFrom}</td><td class="label">Time on Risk To</td><td>{$riskTo}</td></tr>
    </table>

    <div class="heading">COVER</div>
    <p class="cover-text">{$coverDescription}</p>

    <table class="table">
        <thead>
            <tr>
                <th>Reg. Mark</th>
                <th>Make/Model</th>
                <th>YOM</th>
                <th>Number Of Passengers</th>
                <th>Logbook</th>
                <th>Estimated Value Including Accessories &amp; Spare</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{$this->valueOrDash($vehicle['Registration Number'] ?? null)}</td>
                <td>{$this->valueOrDash($vehicle['Make & Model'] ?? null)}</td>
                <td>{$this->valueOrDash($vehicle['Year of Manufacture'] ?? null)}</td>
                <td>{$this->valueOrDash($vehicle['Passengers'] ?? null)}</td>
                <td>{$this->valueOrDash($vehicle['Logbook'] ?? null)}</td>
                <td>{$this->valueOrDash($cover['Sum Insured'] ?? null)}</td>
            </tr>
        </tbody>
    </table>

    <table class="details-grid">
        <tr><td class="label">Chassis Number</td><td>{$this->valueOrDash($vehicle['Chassis Number'] ?? null)}</td><td class="label">Engine Number</td><td>{$this->valueOrDash($vehicle['Engine Number'] ?? null)}</td></tr>
        <tr><td class="label">Body Type</td><td>{$this->valueOrDash($vehicle['Body Type'] ?? null)}</td><td class="label">Use of Vehicle</td><td>{$this->valueOrDash($vehicle['Use of Vehicle'] ?? null)}</td></tr>
        <tr><td class="label">Cover Type</td><td>{$this->valueOrDash($cover['Cover Type'] ?? null)}</td><td class="label">Sum Insured</td><td>{$this->valueOrDash($cover['Sum Insured'] ?? null)}</td></tr>
    </table>

    <table class="table">
        <thead>
            <tr>
                <th>DESCRIPTION</th>
                <th>LIMITS OF LIABILITY</th>
                <th>EXCESS</th>
            </tr>
        </thead>
        <tbody>
            {$limitsBodyRows}
        </tbody>
    </table>

    <div class="row-heading">APPLICABLE CLAUSES</div>
    <p>{$conditionsText}</p>
    <div class="row-heading">EXCLUSION</div>
    <p>{$exclusionsText}</p>

    <div class="heading">PREMIUM COMPUTATION(KSHS)</div>
    <table class="details-grid">
        <tr><td class="label">Premium (Total Premium)</td><td>{$this->formatAmount($premiumPayable)}</td><td class="label">Basic Premium</td><td>{$this->formatAmount($basicPremium)}</td></tr>
        <tr><td class="label">Time on Risk Premium</td><td>{$this->formatAmount($timeOnRiskPremium)}</td><td class="label">First Premium Total</td><td>{$this->formatAmount($firstPremiumTotal)}</td></tr>
        <tr><td class="label">Policyholders Fund (0.25%)</td><td>{$this->formatAmount($phcf)}</td><td class="label">Training Levy (0.20%)</td><td>{$this->formatAmount($trainingLevy)}</td></tr>
        <tr><td class="label">Stamp Duty</td><td>{$this->formatAmount($stampDuty)}</td><td class="label">Payment Method</td><td>{$paymentMethod}</td></tr>
    </table>

    <table class="details-grid signatures">
        <tr><td class="label">ISSUING INSURANCE OFFICER:</td><td>{$issuingOfficer}</td><td class="label">DATE:</td><td>{$this->valueOrDash($header['Date of Issue'] ?? null)}</td></tr>
    </table>
</body>
</html>
HTML;
    }

    protected function formatRiskNoteContent(string $content): string
    {
        $lines = preg_split('/\R/u', trim($content)) ?: [];
        $sections = [];
        $currentSection = null;
        $sectionBody = '';

        $flushSection = function () use (&$sections, &$currentSection, &$sectionBody): void {
            if ($currentSection === null) {
                return;
            }

            $normalizedSection = strtolower($currentSection);
            $cardClass = match ($normalizedSection) {
                'conditions' => 'section-card section-card-conditions',
                'notes' => 'section-card section-card-notes',
                default => 'section-card',
            };
            $shouldSpanFullWidth = in_array($normalizedSection, ['conditions', 'notes', 'exclusions'], true)
                || str_contains($sectionBody, 'styled-table')
                || str_contains($sectionBody, 'bullet-list');

            $sections[] = [
                'title' => $currentSection,
                'body' => $sectionBody,
                'class' => $cardClass,
                'full_width' => $shouldSpanFullWidth,
            ];
            $sectionIndex = array_key_last($sections);
            foreach ($sections as $index => $section) {
                if ($index === $sectionIndex || $section['title'] !== $currentSection) {
                    continue;
                }

                $sections[$index]['body'] .= $sections[$sectionIndex]['body'];
                $sections[$index]['full_width'] = $sections[$index]['full_width'] || $sections[$sectionIndex]['full_width'];
                array_pop($sections);
                break;
            }
            $sectionBody = '';
        };

        $i = 0;
        $count = count($lines);

        while ($i < $count) {
            $line = trim($lines[$i] ?? '');

            if ($line === '' || str_starts_with($line, '===')) {
                $i++;
                continue;
            }

            if ($this->isSectionHeading($line)) {
                if ($line === 'Header') {
                    $i++;
                    continue;
                }
                $flushSection();
                $currentSection = $line;
                $i++;
                continue;
            }

            if (str_starts_with($line, '|')) {
                $tableLines = [];
                while ($i < $count && str_starts_with(trim($lines[$i] ?? ''), '|')) {
                    $tableLines[] = trim($lines[$i] ?? '');
                    $i++;
                }
                $sectionBody .= $this->renderPipeTable($tableLines);
                continue;
            }

            if (str_starts_with($line, '- ')) {
                $bullets = [];
                while ($i < $count && str_starts_with(trim($lines[$i] ?? ''), '- ')) {
                    $bullets[] = trim(substr(trim($lines[$i] ?? ''), 2));
                    $i++;
                }
                $items = implode('', array_map(fn (string $item): string => '<li>'.e($item).'</li>', $bullets));
                $sectionBody .= "<ul class=\"bullet-list\">{$items}</ul>";
                continue;
            }

            if (str_contains($line, ':')) {
                [$label, $value] = array_map('trim', explode(':', $line, 2));
                $sectionBody .= '<div class="info-row"><span class="info-label">'.e($label).':</span> '.e($value).'</div>';
                $i++;
                continue;
            }

            $sectionBody .= '<p>'.e($line).'</p>';
            $i++;
        }

        $flushSection();

        return $this->renderSectionGrid($sections);
    }

    /**
     * @param  array<int, array{title: string, body: string, class: string, full_width: bool}>  $sections
     */
    protected function renderSectionGrid(array $sections): string
    {
        if ($sections === []) {
            return '';
        }

        $standardSections = [];
        $fullWidthSections = [];

        foreach ($sections as $section) {
            if ($section['full_width']) {
                $fullWidthSections[] = $section;
                continue;
            }

            $standardSections[] = $section;
        }

        $rows = '';
        $leftColumnCards = '';
        $rightColumnCards = '';
        $leftWeight = 0;
        $rightWeight = 0;

        foreach ($standardSections as $section) {
            $sectionHtml = '<div class="'.e($section['class']).'"><h2>'.e($section['title']).'</h2>'.$section['body'].'</div>';
            $sectionWeight = mb_strlen(strip_tags($section['body']));

            if ($leftWeight <= $rightWeight) {
                $leftColumnCards .= $sectionHtml;
                $leftWeight += $sectionWeight;
                continue;
            }

            $rightColumnCards .= $sectionHtml;
            $rightWeight += $sectionWeight;
        }

        $rows .= '<tr><td class="section-col"><div class="section-stack">'.$leftColumnCards.'</div></td><td class="section-col"><div class="section-stack">'.$rightColumnCards.'</div></td></tr>';

        foreach ($fullWidthSections as $section) {
            $sectionHtml = '<div class="'.e($section['class']).'"><h2>'.e($section['title']).'</h2>'.$section['body'].'</div>';
            $rows .= '<tr><td class="section-col" colspan="2">'.$sectionHtml.'</td></tr>';
        }

        return '<table class="section-grid" width="100%" cellpadding="0" cellspacing="0">'.$rows.'</table>';
    }

    protected function isSectionHeading(string $line): bool
    {
        return in_array($line, [
            'Header',
            'Insured Information',
            'Vehicle Details',
            'Insurance Cover',
            'Limits of Liability',
            'Financials',
            'Employees',
            'Dependants',
            'Benefits Summary',
            'Conditions',
            'Exclusions',
            'Notes',
        ], true);
    }

    /**
     * @param  array<int, string>  $tableLines
     */
    protected function renderPipeTable(array $tableLines): string
    {
        if ($tableLines === []) {
            return '';
        }

        $rows = array_map(function (string $line): array {
            $trimmed = trim($line, '|');
            return array_map(static fn (string $cell): string => trim($cell), explode('|', $trimmed));
        }, $tableLines);

        $headers = array_shift($rows) ?? [];
        $headHtml = implode('', array_map(fn (string $cell): string => '<th>'.e($cell).'</th>', $headers));
        $bodyHtml = '';

        foreach ($rows as $row) {
            $bodyHtml .= '<tr>'.implode('', array_map(fn (string $cell): string => '<td>'.e($cell).'</td>', $row)).'</tr>';
        }

        return "<table class=\"styled-table\"><thead><tr>{$headHtml}</tr></thead><tbody>{$bodyHtml}</tbody></table>";
    }

    protected function resolvePdfLogoDataUri(): ?string
    {
        $candidates = [
            public_path('hamaline-logo.png'),
            public_path('hamline-logo.png'),
            public_path('hamline-logo.jpg'),
            public_path('hamline-logo.jpeg'),
            public_path('logo.png'),
            public_path('logo.jpg'),
            public_path('logo.jpeg'),
            public_path('apple-touch-icon.png'),
        ];

        foreach ($candidates as $path) {
            if (! is_file($path)) {
                continue;
            }

            $raw = @file_get_contents($path);
            if ($raw === false) {
                continue;
            }

            $mime = mime_content_type($path) ?: 'image/png';
            return 'data:'.$mime.';base64,'.base64_encode($raw);
        }

        return null;
    }

    protected function resolveInsurerLogoDataUri(string $insurerName): ?string
    {
        $defaultLogo = $this->resolvePdfLogoDataUri();
        if ($defaultLogo !== null) {
            return $defaultLogo;
        }

        $normalizedInsurer = strtolower(trim($insurerName));
        $insurerCandidates = [];

        if (str_contains($normalizedInsurer, 'cic')) {
            $insurerCandidates = [
                public_path('cic-logo.png'),
                public_path('cic-logo.jpg'),
                public_path('cic-group-logo.png'),
            ];
        }

        foreach (array_merge($insurerCandidates, [
            public_path('insurer-logo.png'),
            public_path('insurer-logo.jpg'),
        ]) as $path) {
            if (! is_file($path)) {
                continue;
            }

            $raw = @file_get_contents($path);
            if ($raw === false) {
                continue;
            }

            $mime = mime_content_type($path) ?: 'image/png';
            return 'data:'.$mime.';base64,'.base64_encode($raw);
        }

        return $this->resolvePdfLogoDataUri();
    }

    /**
     * @return array<string, array{kv: array<string, string>, bullets: array<int, string>, table_rows: array<int, array<int, string>>}>
     */
    protected function parseRiskNoteSections(string $content): array
    {
        $lines = preg_split('/\R/u', trim($content)) ?: [];
        $sections = [];
        $currentSection = null;

        foreach ($lines as $rawLine) {
            $line = trim($rawLine);
            if ($line === '' || str_starts_with($line, '===')) {
                continue;
            }

            if ($this->isSectionHeading($line)) {
                $currentSection = $line;
                $sections[$currentSection] ??= ['kv' => [], 'bullets' => [], 'table_rows' => []];
                continue;
            }

            if ($currentSection === null || $currentSection === 'Header') {
                $sections['Header'] ??= ['kv' => [], 'bullets' => [], 'table_rows' => []];
                $currentSection = 'Header';
            }

            if (str_starts_with($line, '|')) {
                $row = array_map('trim', explode('|', trim($line, '|')));
                if ($row !== []) {
                    $sections[$currentSection]['table_rows'][] = $row;
                }
                continue;
            }

            if (str_starts_with($line, '- ')) {
                $sections[$currentSection]['bullets'][] = trim(substr($line, 2));
                continue;
            }

            if (str_contains($line, ':')) {
                [$label, $value] = array_map('trim', explode(':', $line, 2));
                $sections[$currentSection]['kv'][$label] = $value;
            }
        }

        foreach ($sections as $name => $section) {
            if (count($section['table_rows']) > 1) {
                $sections[$name]['table_rows'] = array_slice($section['table_rows'], 1);
            }
        }

        return $sections;
    }

    protected function extractNoteValue(array $notes, string $label): ?string
    {
        foreach ($notes as $note) {
            if (! str_starts_with($note, $label.':')) {
                continue;
            }

            return trim(substr($note, strlen($label) + 1));
        }

        return null;
    }

    protected function normalizeCurrencyNumber(?string $value): float
    {
        if ($value === null) {
            return 0;
        }

        $sanitized = preg_replace('/[^0-9.\-]/', '', $value) ?: '0';
        return (float) $sanitized;
    }

    protected function formatAmount(float $amount): string
    {
        return number_format($amount, 2);
    }

    protected function valueOrDash(?string $value): string
    {
        return e($value !== null && $value !== '' ? $value : '-');
    }
}
