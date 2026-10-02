import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { MyInvoice } from '../../../invoices/interface/my-invoice.interface';
import { LangService } from '../../../shared/services/lang.service';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';

/** Órdenes de comida del cliente; cada fila abre el detalle de la factura. */
@Component({
  selector: 'app-my-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslateModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './my-orders-list.component.html',
  styleUrl: './my-orders-list.component.scss'
})
export class MyOrdersListComponent {
  /** Solo las facturas que tienen productos de la carta. */
  @Input() invoices: MyInvoice[] = [];

  private readonly _lang = inject(LangService);

  detailRoute(id: number): string {
    return this._lang.route(`user/invoices/${id}`);
  }

  menuRoute(): string {
    return this._lang.route('gastronomy');
  }

  /** ENT entregado; cualquier otro estado (p. ej. en cocina) va en primario. */
  chipClass(code?: string): string {
    return (code ?? '').toUpperCase() === 'ENT'
      ? 'text-[var(--success,#2e7d32)] border-[var(--success,#2e7d32)]'
      : 'text-[var(--primary-color)] border-[var(--primary-color)]';
  }
}
