<?php

namespace App\Http\Controllers\RiskNotes\Concerns;

trait BuildsRiskNotePdfHtml
{
    protected function buildRiskNotePdfHtml(string $content, string $type, string $riskNoteNumber, string $insurerName): string
    {
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

        $rows = '';
        $pendingSection = null;

        foreach ($sections as $section) {
            $sectionHtml = '<div class="'.e($section['class']).'"><h2>'.e($section['title']).'</h2>'.$section['body'].'</div>';

            if ($section['full_width']) {
                if ($pendingSection !== null) {
                    $rows .= '<tr><td class="section-col">'.$pendingSection.'</td><td class="section-col"></td></tr>';
                    $pendingSection = null;
                }

                $rows .= '<tr><td class="section-col" colspan="2">'.$sectionHtml.'</td></tr>';
                continue;
            }

            if ($pendingSection === null) {
                $pendingSection = $sectionHtml;
                continue;
            }

            $rows .= '<tr><td class="section-col">'.$pendingSection.'</td><td class="section-col">'.$sectionHtml.'</td></tr>';
            $pendingSection = null;
        }

        if ($pendingSection !== null) {
            $rows .= '<tr><td class="section-col">'.$pendingSection.'</td><td class="section-col"></td></tr>';
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
}
