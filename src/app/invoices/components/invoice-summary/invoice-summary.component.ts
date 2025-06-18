import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  PaidType,
  PayType
} from '../../../shared/interfaces/relatedDataGeneral';
import { Invoice } from '../../interface/invoice.interface';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.scss'
})
export class InvoiceSummaryComponent {
  @Input() invoiceData!: Invoice;
  @Input() paidTypes: PaidType[] = [];
  @Input() payTypes: PayType[] = [];
  @Output() printRequested = new EventEmitter<void>();

  onPrint() {
    this.printRequested.emit();
  }
}
