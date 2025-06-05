import { Component, Input } from '@angular/core';
import {
  PaidType,
  PayType
} from '../../../shared/interfaces/relatedDataGeneral';
import { Invoice } from '../../interface/invoice.interface';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.scss'
})
export class InvoiceSummaryComponent {
  @Input() invoice!: Invoice;
  @Input() paidTypes: PaidType[] = [];
  @Input() payTypes: PayType[] = [];
}
