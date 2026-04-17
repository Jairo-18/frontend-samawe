import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { Invoice } from '../../invoices/interface/invoice.interface';
@Injectable({ providedIn: 'root' })
export class InvoicePrintService {
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _platformId = inject(PLATFORM_ID);
  async printInvoice(_invoice: Invoice, _element: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    console.warn('printInvoice: html2pdf removed — pending SSR-compatible replacement');
  }
  async downloadInvoice(_invoice: Invoice, _element: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this._platformId)) return;
    console.warn('downloadInvoice: html2pdf removed — pending SSR-compatible replacement');
  }
}
