<?php

namespace App\Http\Controllers\RiskNotes\Concerns;

trait BuildsRiskNotePdfHtml
{
    protected function buildRiskNotePdfHtml(string $content, string $type, string $riskNoteNumber, string $insurerName): string
    {
        $formattedContent = $this->formatRiskNoteContent($content);
        $intermediary = 'Hamline Insurance Agency (Intermediary)';

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
            padding: 28px;
            background: #f8fafc;
        }
        .page {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 18px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0 0 4px 0;
            font-size: 22px;
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
            color: #1e40af;
            font-size: 15px;
            margin: 0 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 2px solid #3b82f6;
        }
        .info-row {
            margin-bottom: 6px;
        }
        .info-label {
            color: #1e40af;
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
            background: #1e40af;
            color: #ffffff;
            font-weight: 700;
        }
        .conditions {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
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
            <h1>{$type} Risk Note</h1>
            <p class="header-meta">{$intermediary}</p>
            <div class="meta-grid">
                <div><strong>Risk Note:</strong> {$riskNoteNumber}</div>
                <div><strong>Insurer:</strong> {$insurerName}</div>
            </div>
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
            $html .= "<div class=\"section\"><h2>{$currentSection}</h2><div{$classAttr}>{$sectionBody}</div></div>";
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

        return $html;
    }

    protected function isSectionHeading(string $line): bool
    {
        return in_array($line, [
            'Header',
            'Insured Information',
            'Vehicle Details',
            'Insurance Cover',
            'Financials',
            'Employees',
            'Dependants',
            'Benefits Summary',
            'Conditions',
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
}

