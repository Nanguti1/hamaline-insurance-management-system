<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuotationIssuedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Quotation $quotation,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your quotation '.$this->quotation->quotation_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.quotation-issued',
        );
    }
}
