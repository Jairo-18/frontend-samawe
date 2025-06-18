import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Invoice } from '../../interface/invoice.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-pdf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-pdf.component.html',
  styleUrl: './invoice-pdf.component.scss'
})
export class InvoicePdfComponent {
  @Input() invoiceData!: Invoice;
  @ViewChild('pdfWrapper') pdfWrapper!: ElementRef;

  get nativeElement(): HTMLElement {
    return this.pdfWrapper?.nativeElement;
  }

  formatCop(value: string | number): string {
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numeric)) return '0 COP';
    return `${numeric.toLocaleString('es-CO', {
      minimumFractionDigits: 0
    })} COP`;
  }
}
