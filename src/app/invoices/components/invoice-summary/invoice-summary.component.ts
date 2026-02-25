import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  PaidType,
  PayType
} from '../../../shared/interfaces/relatedDataGeneral';
import { Invoice } from '../../interface/invoice.interface';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [CommonModule, MatButtonModule, FormatCopPipe],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.scss'
})
export class InvoiceSummaryComponent {
  @Input() invoiceData!: Invoice;
  @Input() paidTypes: PaidType[] = [];
  @Input() payTypes: PayType[] = [];
  @Output() printRequested = new EventEmitter<void>();
  @Output() downloadRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<void>();
  @Output() toggleAllPaymentStatus = new EventEmitter<boolean>();
  get paidTotal(): number {
    if (this.invoiceData.paidTotal !== undefined) {
      return this.invoiceData.paidTotal;
    }
    return (this.invoiceData.invoiceDetails || [])
      .filter((detail) => detail.isPaid)
      .reduce((acc, detail) => acc + parseFloat(detail.subtotal || '0'), 0);
  }
  get pendingAmount(): number {
    const total = parseFloat(this.invoiceData.total || '0');
    return Math.max(0, total - this.paidTotal);
  }
  get allPaid(): boolean {
    return (
      (this.invoiceData.invoiceDetails || []).length > 0 &&
      (this.invoiceData.invoiceDetails || []).every((d) => d.isPaid)
    );
  }
  onPrint() {
    this.printRequested.emit();
  }
  onDownload() {
    this.downloadRequested.emit();
  }
  onEdit() {
    this.editRequested.emit();
  }
  toggleAll() {
    this.toggleAllPaymentStatus.emit(!this.allPaid);
  }
}

