import { Injectable, inject } from '@angular/core';
import html2pdf from 'html2pdf.js';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { Invoice } from '../../invoices/interface/invoice.interface';
@Injectable({ providedIn: 'root' })
export class InvoicePrintService {
  private readonly _invoiceService = inject(InvoiceService);
  async printInvoice(invoice: Invoice, element: HTMLElement): Promise<void> {
    const options = {
      margin: 0.5,
      filename: `${invoice.invoiceType.code}-${invoice.code}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    html2pdf()
      .set(options)
      .from(element)
      .toPdf()
      .get('pdf')

      .then((pdf: any) => {
        const pdfUrl = pdf.output('bloburl');
        window.open(pdfUrl, '_blank');
      });
  }
  async downloadInvoice(invoice: Invoice, element: HTMLElement): Promise<void> {
    const options = {
      margin: 0.5,
      filename: `${invoice.invoiceType.code}-${invoice.code}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    await html2pdf().set(options).from(element).save();
  }
}

