import { Component, Input } from '@angular/core';
import {
  PaidType,
  PayType
} from '../../../shared/interfaces/relatedDataGeneral';
import { Invoice } from '../../interface/invoice.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.scss'
})
export class InvoiceSummaryComponent {
  @Input() invoiceData!: Invoice;
  @Input() paidTypes: PaidType[] = [];
  @Input() payTypes: PayType[] = [];
}
