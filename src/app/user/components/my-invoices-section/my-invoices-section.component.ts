import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';

import { InvoiceService } from '../../../invoices/services/invoice.service';
import { MyInvoice } from '../../../invoices/interface/my-invoice.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MyStaysListComponent } from '../my-stays-list/my-stays-list.component';
import { MyOrdersListComponent } from '../my-orders-list/my-orders-list.component';

/**
 * Historial paginado del cliente: estadías u órdenes de comida. Pide al
 * servidor una página a la vez (5 o 10 por página, nunca más), con loader
 * mientras llega y paginador con "primera" y "última".
 *
 * Lo usan el inicio del cliente y las pestañas de su perfil.
 */
@Component({
  selector: 'app-my-invoices-section',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    TranslateModule,
    LoaderComponent,
    MyStaysListComponent,
    MyOrdersListComponent
  ],
  templateUrl: './my-invoices-section.component.html',
  styleUrl: './my-invoices-section.component.scss'
})
export class MyInvoicesSectionComponent implements OnInit {
  @Input({ required: true }) kind!: 'stays' | 'orders';
  /** Nombre del hotel, para el mensaje de lista vacía de las estadías. */
  @Input() hotelName = '';

  private readonly _invoiceService = inject(InvoiceService);

  invoices: MyInvoice[] = [];
  pagination: PaginationInterface | null = null;
  page = 1;
  perPage = 5;
  loading = true;
  loadError = false;

  ngOnInit(): void {
    this._load();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this._load();
  }

  private _load(): void {
    this.loading = true;
    this.loadError = false;
    this._invoiceService
      .getMine({ kind: this.kind, page: this.page, perPage: this.perPage })
      .subscribe({
        next: (res) => {
          this.invoices = res.data ?? [];
          this.pagination = res.pagination ?? null;
          this.loading = false;
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
        }
      });
  }
}
