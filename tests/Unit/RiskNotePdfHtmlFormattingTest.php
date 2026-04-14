<?php

namespace Tests\Unit;

use App\Http\Controllers\RiskNotes\Concerns\BuildsRiskNotePdfHtml;
use PHPUnit\Framework\TestCase;

class RiskNotePdfHtmlFormattingTest extends TestCase
{
    public function test_it_renders_standard_sections_in_two_column_cards(): void
    {
        $renderer = new class
        {
            use BuildsRiskNotePdfHtml;

            public function renderContent(string $content): string
            {
                return $this->formatRiskNoteContent($content);
            }
        };

        $content = <<<TXT
Insured Information
Risk Note Number: MTRN-2026-0016
Agency Name: Hamaline Insurance Agency

Vehicle Details
Registration Number: KDA123A
Make & Model: Toyota Axio

Financials
Premium Payable: 500000.00 KES
First Premium Total: 40000.00
TXT;

        $html = $renderer->renderContent($content);

        $this->assertStringContainsString('class="section-grid"', $html);
        $this->assertStringContainsString('class="section-card"', $html);
        $this->assertStringContainsString('<span class="info-label">Risk Note Number:</span> MTRN-2026-0016', $html);
        $this->assertStringContainsString('<span class="info-label">Registration Number:</span> KDA123A', $html);
    }

    public function test_it_keeps_notes_and_conditions_as_full_width_cards(): void
    {
        $renderer = new class
        {
            use BuildsRiskNotePdfHtml;

            public function renderContent(string $content): string
            {
                return $this->formatRiskNoteContent($content);
            }
        };

        $content = <<<TXT
Insured Information
Risk Note Number: MTRN-2026-0016

Conditions
- Cover is subject to insurer underwriting review.

Notes
- This risk note serves as temporary confirmation.
TXT;

        $html = $renderer->renderContent($content);

        $this->assertStringContainsString('section-card-conditions', $html);
        $this->assertStringContainsString('section-card-notes', $html);
        $this->assertStringContainsString('colspan="2"', $html);
    }

    public function test_it_uses_compact_pdf_layout_styles_for_single_page_output(): void
    {
        $renderer = new class
        {
            use BuildsRiskNotePdfHtml;

            public function renderDocument(string $content): string
            {
                return $this->buildRiskNotePdfHtml($content, 'Motor', 'MTRN-2026-0016', 'Insurer A');
            }
        };

        $html = $renderer->renderDocument('Insured Information'."\n".'Insured Name: Jane Doe');

        $this->assertStringContainsString('@page {', $html);
        $this->assertStringContainsString('margin: 6mm;', $html);
        $this->assertStringContainsString('font-size: 9px;', $html);
        $this->assertStringContainsString('line-height: 1.2;', $html);
    }
}
