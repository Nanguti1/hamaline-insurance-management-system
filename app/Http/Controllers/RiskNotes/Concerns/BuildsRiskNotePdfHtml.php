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
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #111827;
            margin: 0;
            padding: 14px;
            background: #f8fafc;
        }
        .page {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
        }
        .header {
            background: #062e4a;
            color: #ffffff;
            padding: 12px 14px;
            border-radius: 10px;
            margin-bottom: 14px;
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
            height: 48px;
            width: auto;
            max-width: 180px;
            display: block;
            background: #ffffff;
            border-radius: 8px;
            padding: 4px 8px;
        }
        .brand-logo-fallback {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .header h1 {
            margin: 0 0 4px 0;
            font-size: 20px;
            letter-spacing: 0.3px;
        }
        .header-meta {
            margin: 0;
            font-size: 11px;
            opacity: 0.95;
        }
        .meta-grid {
            margin-top: 10px;
            font-size: 11px;
        }
        .section {
            margin-bottom: 16px;
        }
        .section h2 {
            color: #062e4a;
            font-size: 15px;
            margin: 0 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 2px solid #062e4a;
        }
        .info-row {
            margin-bottom: 6px;
        }
        .cards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .kv-card {
            border: 1px solid #dbe5ef;
            border-radius: 8px;
            padding: 8px 10px;
            background: #f8fbff;
        }
        .kv-label {
            font-size: 11px;
            color: #334155;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .kv-value {
            font-size: 12px;
            color: #0f172a;
        }
        .info-label {
            color: #062e4a;
            font-weight: 700;
        }
        .styled-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .styled-table th,
        .styled-table td {
            border: 1px solid #dbeafe;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        .styled-table th {
            background: #062e4a;
            color: #ffffff;
            font-weight: 700;
        }
        .conditions {
            background: #edf4f8;
            border-left: 4px solid #062e4a;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .notes {
            background: #fef9c3;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .bullet-list {
            margin: 0;
            padding-left: 16px;
        }
        .bullet-list li {
            margin-bottom: 4px;
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
        $html = '';
        $currentSection = null;
        $sectionBody = '';

        $flushSection = function () use (&$html, &$currentSection, &$sectionBody): void {
            if ($currentSection === null) {
                return;
            }

            $sectionClass = match (strtolower($currentSection)) {
                'conditions' => 'conditions',
                'notes' => 'notes',
                default => '',
            };

            $classAttr = $sectionClass ? " class=\"{$sectionClass}\"" : '';
            $usesCards = str_contains($sectionBody, 'kv-card')
                && ! str_contains($sectionBody, 'styled-table')
                && ! str_contains($sectionBody, 'bullet-list');

            $bodyHtml = $usesCards ? "<div class=\"cards-grid\">{$sectionBody}</div>" : $sectionBody;

            $html .= "<div class=\"section\"><h2>{$currentSection}</h2><div{$classAttr}>{$bodyHtml}</div></div>";
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
                $sectionBody .= '<div class="kv-card"><div class="kv-label">'.e($label).'</div><div class="kv-value">'.e($value).'</div></div>';
                $i++;
                continue;
            }

            $sectionBody .= '<p>'.e($line).'</p>';
            $i++;
        }

        $flushSection();

        return $html;
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
