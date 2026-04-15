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

    public function test_it_uses_compact_pdf_layout_styles_for_non_motor_output(): void
    {
        $renderer = new class
        {
            use BuildsRiskNotePdfHtml;

            public function renderDocument(string $content): string
            {
                return $this->buildRiskNotePdfHtml($content, 'Medical', 'MTRN-2026-0016', 'Insurer A');
            }
        };

        $html = $renderer->renderDocument('Insured Information'."\n".'Insured Name: Jane Doe');

        $this->assertStringContainsString('@page {', $html);
        $this->assertStringContainsString('margin: 6mm;', $html);
        $this->assertStringContainsString('font-size: 9px;', $html);
        $this->assertStringContainsString('line-height: 1.2;', $html);
    }

    public function test_it_renders_motor_pdf_with_legacy_layout_and_derived_premium_breakdown(): void
    {
        $renderer = new class
        {
            use BuildsRiskNotePdfHtml;

            public function renderDocument(string $content): string
            {
                return $this->buildRiskNotePdfHtml($content, 'Motor', 'MTRN-2026-0016', 'Insurer A');
            }
        };

        $content = <<<TXT
Header
Risk Note Number: MTRN-2026-0016
Insurer: CIC
Insurer Policy Number: MTR/123
Internal Policy Number: MPC/1
Binder Name: Motor Binder
Currency: KSH
Date of Issue: 07/01/2026

Insured Information
Name: Jane Doe
Customer ID: C-001
Email: jane@example.com
Mobile: 0711111111
Tel (Others): 0722222222
Postal Address: P.O Box 3178
PIN Number: A001
Period of Insurance: 08/01/2026 - 07/01/2027
Time on Risk: 08/01/2026 - 07/03/2026

Vehicle Details
Registration Number: KDA123A
Make & Model: Toyota Axio
Year of Manufacture: 2017
Passengers: 5
Logbook: COPY

Insurance Cover
Cover Type: Comprehensive
Sum Insured: 3200000

Limits of Liability
| Description | Limit | Excess |
| Radio Cassette | Sum Insured | NIL |

Financials
Premium Payable: 20000.00 KSH
TXT;

        $html = $renderer->renderDocument($content);

        $this->assertStringContainsString('POLICY DETAILS', $html);
        $this->assertStringContainsString('Hamaline Insurance Agency - Registration KDA123A', $html);
        $this->assertStringContainsString('Motor Private Insurance Quotation', $html);
        $this->assertStringContainsString('header-divider', $html);
        $this->assertStringContainsString('CLIENT DETAILS', $html);
        $this->assertStringContainsString('Time on Risk From', $html);
        $this->assertStringContainsString('PREMIUM COMPUTATION(KSHS)', $html);
        $this->assertStringContainsString('Subject to our standard policy terms and conditions', $html);
        $this->assertStringContainsString('PREPARED BY:', $html);
        $this->assertStringContainsString('REVIEWED BY:', $html);
        $this->assertStringContainsString('Policyholders Fund (0.25%)', $html);
        $this->assertStringContainsString('50.00', $html);
        $this->assertStringContainsString('Training Levy (0.20%)', $html);
        $this->assertStringContainsString('40.00', $html);
        $this->assertStringContainsString('19,870.00', $html);
    }

    public function test_it_renders_standard_cards_before_full_width_sections_to_reduce_empty_space(): void
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
Name: Jane Doe

Vehicle Details
Registration Number: KDA123A

Insurance Cover
Cover Type: Comprehensive

Limits of Liability
| Description | Limit | Excess |
| Third Party Property Damage | Ksh 20,000,000 | Ksh 7,500 |

Financials
Premium Payable: 25000.00 KES
TXT;

        $html = $renderer->renderContent($content);

        $coverPosition = strpos($html, '<h2>Insurance Cover</h2>');
        $financialsPosition = strpos($html, '<h2>Financials</h2>');
        $limitsPosition = strpos($html, '<h2>Limits of Liability</h2>');

        self::assertIsInt($coverPosition);
        self::assertIsInt($financialsPosition);
        self::assertIsInt($limitsPosition);
        self::assertLessThan($financialsPosition, $limitsPosition);
        self::assertStringContainsString('<div class="section-stack">', $html);
        self::assertStringContainsString('<h2>Insurance Cover</h2>', $html);
        self::assertStringContainsString('<h2>Financials</h2>', $html);
    }

    public function test_it_merges_duplicate_sections_in_downloadable_html(): void
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
Notes
- Initial note.

Notes
- Follow-up note.
TXT;

        $html = $renderer->renderContent($content);

        self::assertSame(1, substr_count($html, '<h2>Notes</h2>'));
        self::assertStringContainsString('Initial note.', $html);
        self::assertStringContainsString('Follow-up note.', $html);
    }
}
