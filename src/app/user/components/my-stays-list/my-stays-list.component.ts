import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { MyInvoice } from '../../../invoices/interface/my-invoice.interface';
import { LangService } from '../../../shared/services/lang.service';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { localToday } from '../../../shared/utils/local-date.util';

/**
 * Estadías del cliente. Cada tarjeta lleva al detalle de la factura
 * (`user/invoices/:id`). Lo usan el inicio del cliente y su perfil.
 */
@Component({
  selector: 'app-my-stays-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslateModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './my-stays-list.component.html',
  styleUrl: './my-stays-list.component.scss'
})
export class MyStaysListComponent {
  /** Solo las facturas que tienen alojamiento. */
  @Input() invoices: MyInvoice[] = [];
  /** Nombre del hotel para el mensaje de lista vacía. */
  @Input() hotelName = '';

  private readonly _lang = inject(LangService);

  detailRoute(id: number): string {
    return this._lang.route(`user/invoices/${id}`);
  }

  lodgingRoute(): string {
    return this._lang.route('accommodation');
  }

  /**
   * Las estadías no usan `stateType` (eso es de cocina): su momento sale de las
   * fechas. Comparación por día, no por hora, para que el día de salida siga
   * contando como "en curso" hasta que termina.
   */
  phase(invoice: MyInvoice): 'upcoming' | 'current' | 'past' {
    const start = invoice.stays[0]?.startDate;
    const end = invoice.stays[invoice.stays.length - 1]?.endDate ?? start;
    const today = localToday();
    if (start && today < start) return 'upcoming';
    if (end && today > end) return 'past';
    return 'current';
  }

  chipClass(phase: 'upcoming' | 'current' | 'past'): string {
    return phase === 'past'
      ? 'text-[var(--subtitle-color)] border-[var(--subtitle-color)]'
      : 'text-[var(--primary-color)] border-[var(--primary-color)]';
  }
}
