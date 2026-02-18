import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaxeType } from '../../../shared/interfaces/relatedDataGeneral';
import { PendingInvoiceDetail } from '../../interface/pending-item.interface';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';

@Component({
  selector: 'app-pending-items-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormatCopPipe
  ],
  templateUrl: './pending-items-table.html',
  styleUrl: './pending-items-table.scss'
})
export class PendingItemsTableComponent {
  @Input() pendingItems: PendingInvoiceDetail[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Input() isSaving: boolean = false;

  @Output() itemDeleted = new EventEmitter<number>();
  @Output() saveAll = new EventEmitter<void>();

  displayedColumns: string[] = [
    // 'code', // No code available yet for pending items
    'type',
    'name',
    'startDate',
    'endDate',
    'amount',
    'priceWithoutTax',
    'tax',
    'subtotal',
    'actions'
  ];

  // --- Helpers ---

  getTaxPercentage(taxeTypeId?: number): number {
    if (!taxeTypeId) return 0;
    const tax = this.taxeTypes.find((t) => t.taxeTypeId === taxeTypeId);
    if (!tax || tax.percentage == null) return 0;
    let rate =
      typeof tax.percentage === 'string'
        ? parseFloat(tax.percentage)
        : tax.percentage;
    if (rate > 1) rate = rate / 100;
    return rate;
  }

  calculateTaxAmount(item: PendingInvoiceDetail): number {
    const priceWithoutTax = Number(item.payload.priceWithoutTax || 0);
    const amount = Number(item.payload.amount || 1);
    const taxRate = this.getTaxPercentage(item.payload.taxeTypeId);
    return priceWithoutTax * amount * taxRate;
  }

  calculateSubtotal(item: PendingInvoiceDetail): number {
    const priceWithoutTax = Number(item.payload.priceWithoutTax || 0);
    const amount = Number(item.payload.amount || 1);
    const taxAmount = this.calculateTaxAmount(item);
    return priceWithoutTax * amount + taxAmount;
  }

  onDelete(index: number) {
    this.itemDeleted.emit(index);
  }

  onSave() {
    this.saveAll.emit();
  }
}
