import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { InvoiceService } from '../../services/invoice.service';
import { ReceivableRow } from '../../interface/invoiceCredit.interface';

/**
 * Cuentas por cobrar: ventas a crédito con saldo pendiente. Las vencidas van
 * primero. Pulsar una fila abre la factura, donde se registran los abonos.
 */
@Component({
  selector: 'app-receivables',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslateModule,
    BasePageComponent,
    LoaderComponent,
    FormatCopPipe
  ],
  templateUrl: './receivables.component.html'
})
export class ReceivablesComponent implements OnInit {
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _router = inject(Router);

  rows: ReceivableRow[] = [];
  loading = true;
  failed = false;
  includePaid = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.failed = false;
    this._invoiceService.getReceivables(this.includePaid).subscribe({
      next: (res) => {
        this.rows = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.failed = true;
        this.loading = false;
      }
    });
  }

  toggleIncludePaid(value: boolean): void {
    this.includePaid = value;
    this.load();
  }

  get totalBalance(): number {
    return this.rows.reduce((sum, r) => sum + r.balance, 0);
  }

  get overdueBalance(): number {
    return this.rows
      .filter((r) => r.status === 'OVERDUE')
      .reduce((sum, r) => sum + r.balance, 0);
  }

  get overdueCount(): number {
    return this.rows.filter((r) => r.status === 'OVERDUE').length;
  }

  statusKey(status: ReceivableRow['status']): string {
    return status === 'NO_TERM'
      ? 'invoice.receivables.status_no_term'
      : `invoice.credit.status_${status.toLowerCase()}`;
  }

  statusClass(status: ReceivableRow['status']): string {
    switch (status) {
      case 'PAID':
        return 'bg-[var(--success-bg)] !text-[var(--success)]';
      case 'PARTIAL':
        return 'bg-[var(--info-bg)] !text-[var(--info)]';
      case 'OVERDUE':
        return 'bg-[var(--danger-bg)] !text-[var(--danger)]';
      default:
        return 'bg-[var(--warning-bg)] !text-[var(--warning)]';
    }
  }

  open(row: ReceivableRow): void {
    this._router.navigate(['/invoice/invoices', row.invoiceId, 'edit']);
  }
}
