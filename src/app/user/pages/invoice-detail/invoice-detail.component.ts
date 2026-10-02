import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { InvoiceService } from '../../../invoices/services/invoice.service';
import { MyInvoiceDetail } from '../../../invoices/interface/my-invoice.interface';
import { LangService } from '../../../shared/services/lang.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';

/**
 * Detalle de una factura propia: una estadía o una orden de comida. Lo que el
 * cliente ve sale de `GET invoices/mine/:id`, que ya viene filtrado en el
 * servidor (sin costos del hotel ni datos del personal) y devuelve 404 si la
 * factura no es suya.
 */
@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslateModule,
    LoaderComponent,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './invoice-detail.component.html'
})
export class InvoiceDetailComponent implements OnInit {
  private readonly _route = inject(ActivatedRoute);
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _lang = inject(LangService);

  invoice: MyInvoiceDetail | null = null;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    const id = Number(this._route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.loading = false;
      this.notFound = true;
      return;
    }
    this._invoiceService.getMineOne(id).subscribe({
      next: (res) => {
        this.invoice = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  /** Estadía si algún renglón es un alojamiento; si no, orden de comida. */
  get isStay(): boolean {
    return this.invoice?.lines.some((l) => l.kind === 'stay') ?? false;
  }

  /** De vuelta a la pestaña de donde se vino. */
  get backRoute(): string {
    return this._lang.route('user/profile');
  }

  get backQuery(): { tab: string } {
    return { tab: this.isStay ? 'stays' : 'orders' };
  }

  get pending(): number {
    return Math.max((this.invoice?.total ?? 0) - (this.invoice?.paidTotal ?? 0), 0);
  }
}
