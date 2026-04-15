<?php

namespace Tests\Unit;

use App\Http\Controllers\Quotations\QuotationController;
use App\Models\Client;
use App\Models\Insurer;
use App\Models\Quotation;
use App\Services\Access\ResourceAccessService;
use ReflectionMethod;
use Tests\TestCase;

class QuotationPdfHtmlFormattingTest extends TestCase
{
    public function test_it_renders_multiline_interests_and_excess_remarks_in_downloadable_pdf_html(): void
    {
        $controller = new QuotationController(new ResourceAccessService);
        $quotation = Quotation::make([
            'quotation_number' => 'QTN-00099',
            'premium_amount' => 56250,
            'sum_insured' => 1250000,
            'quoted_base_premium' => 56250,
            'quoted_training_levy' => 113,
            'quoted_phcf' => 141,
            'quoted_stamp_duty' => 40,
            'quoted_total_premium' => 56543,
            'vehicle_class' => 'MOTOR PRIVATE',
            'vehicle_make_model' => 'Toyota Probox',
            'year_of_manufacture' => 2018,
            'registration_number' => 'KDS 912T',
            'interests_insured' => "Free windscreen – 30,000/=\nNo blame no excess",
            'excess_remarks' => "Accidental damage -2.5% Value min. Shs.20,000\nTPPD - Nil",
            'prepared_by' => 'GEOFFREY ANAVILA',
            'reviewed_by' => 'Operations Team',
            'quoted_on' => '2026-04-14',
        ]);
        $quotation->setRelation('client', Client::make(['name' => 'Fredrick Omondi Onyango']));
        $quotation->setRelation('insurer', Insurer::make(['name' => 'CIC GROUP']));

        $method = new ReflectionMethod($controller, 'buildQuotationPdfHtml');
        $method->setAccessible(true);
        $html = $method->invoke($controller, $quotation);

        self::assertStringContainsString('KDS 912T', $html);
        self::assertStringContainsString('Free windscreen', $html);
        self::assertStringContainsString('No blame no excess', $html);
        self::assertStringContainsString('Accidental damage -2.5% Value min. Shs.20,000', $html);
        self::assertStringContainsString('TPPD - Nil', $html);
        self::assertStringContainsString('header-logo', $html);
        self::assertStringContainsString('Motor Private Insurance Quotation', $html);
    }
}
