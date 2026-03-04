/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { AppRelatedData } from '../../../shared/interfaces/relatedDataGeneral';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { InvoiceComplete } from '../../../invoices/interface/invoice.interface';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { InvoicePrintService } from '../../../shared/services/invoicePrint.service';
import { InvoicePdfComponent } from '../../../invoices/components/invoice-pdf/invoice-pdf.component';
import { CreateInvoiceDialogComponent } from '../../../invoices/components/create-invoice-dialog/create-invoice-dialog.component';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-see-orders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    SearchFieldsComponent,
    LoaderComponent,
    FormatCopPipe,
    SectionHeaderComponent,
    InvoicePdfComponent,
    RelativeTimePipe
  ],
  templateUrl: './see-orders.component.html',
  styleUrls: ['./see-orders.component.scss']
})
export class SeeOrdersComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;
  @ViewChild('invoiceToPrintRef') invoiceToPrintRef!: ElementRef;

  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _router: Router = inject(Router);
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _invoicePrintService: InvoicePrintService =
    inject(InvoicePrintService);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);

  form!: FormGroup;
  invoiceToPrintData?: any;
  isMesero: boolean = false;

  orders: InvoiceComplete[] = [];

  isMobile: boolean = false;
  loading: boolean = false;
  showClearButton: boolean = false;
  params: Record<string, string | number> = {};
  selectedTabIndex: number = 0;

  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 25,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  searchFields: SearchField[] = [
    {
      name: 'search',
      label: 'Código, Mesa',
      type: 'text',
      placeholder: ' '
    },
    {
      name: 'startDate',
      label: 'Fecha de orden',
      type: 'date'
    },
    {
      name: 'stateTypeId',
      label: 'Estado de la orden',
      type: 'select',
      options: [],
      placeholder: 'Buscar por estado'
    },
    {
      name: 'paidTypeId',
      label: 'Estado de pago',
      type: 'select',
      options: [],
      placeholder: 'Buscar por estado pago'
    },
    {
      name: 'payTypeId',
      label: 'Tipo pago',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo pago'
    }
  ];

  constructor() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.paginationParams.perPage = 5;
  }

  ngOnInit(): void {
    const userInfo = this._localStorage.getUserData();
    const role = userInfo?.roleType?.name?.toUpperCase() || '';
    this.isMesero = role === 'MESERO';

    this.loadOrders();
    this.loadRelatedData();
  }

  loadRelatedData(): void {
    const cachedData = this._relatedDataService.relatedData();
    if (cachedData) {
      this.populateSearchFields(cachedData.data);
    } else {
      this._relatedDataService.getRelatedData().subscribe({
        next: (res) => this.populateSearchFields(res.data),
        error: (err: unknown) =>
          console.error('Error loading related data', err)
      });
    }
  }

  private populateSearchFields(data: AppRelatedData): void {
    const optionMap = {
      stateTypeId: (data.stateType || []).filter((t) =>
        [6, 7, 8, 9, 10].includes(Number(t.stateTypeId))
      ),
      paidTypeId: data.paidType,
      payTypeId: data.payType
    };
    this.searchFields = this.searchFields.map((field) => {
      const key = field.name as keyof typeof optionMap;
      const options = optionMap[key];
      if (options) {
        return {
          ...field,
          options: options.map((t: Record<string, any>) => ({
            value: t[key],
            label: t['name'] ?? 'Sin nombre'
          }))
        };
      }
      return field;
    });
  }

  onSearchSubmit(values: Record<string, any>): void {
    this.params = this.formatParams(values);
    this.paginationParams.page = 1;
    this.loadOrders();
  }

  onSearchChange(form: { length?: number; value: Record<string, any> }): void {
    this.showClearButton = !!form.length;
    this.params = this.formatParams(form?.value);
    this.paginationParams.page = 1;
    this.loadOrders();
  }

  private formatParams(
    values: Record<string, any>
  ): Record<string, string | number> {
    const formattedParams: Record<string, string | number> = {};
    if (!values) return formattedParams;

    Object.keys(values).forEach((key) => {
      const val = values[key];
      if (val === null || val === '' || val === undefined) return;
      if (key.endsWith('Id')) {
        formattedParams[key] = Number(val);
        return;
      }
      if (this.searchFields.find((f) => f.name === key)?.type === 'date') {
        formattedParams[key] = this.formatDateISO(val);
        return;
      }
      formattedParams[key] = val;
    });
    return formattedParams;
  }

  private formatDateISO(date: string | Date): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadOrders();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  loadOrders(filter: string = ''): void {
    this.loading = true;

    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      search: filter,
      stateTypeIds: '6,7,8,9,10',
      ...this.params
    };

    this._invoiceService.getInvoiceWithPagination(query).subscribe({
      next: (res: {
        data: InvoiceComplete[];
        pagination: PaginationInterface;
      }) => {
        this.orders = res.data;
        this.paginationParams = res?.pagination;
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }

  openEditDialog(invoiceId: number): void {
    this._router.navigateByUrl(`/recipes/restaurant-order/${invoiceId}/edit`);
  }

  openEditInvoiceDialog(invoiceId: number): void {
    const isMobile = window.innerWidth <= 768;
    const relatedData = this._relatedDataService.relatedData();

    this._matDialog
      .open(CreateInvoiceDialogComponent, {
        width: isMobile ? '90vw' : '60vw',
        data: {
          editMode: true,
          invoiceId: invoiceId,
          relatedData: {
            invoiceType: relatedData?.data?.invoiceType || [],
            payType: relatedData?.data?.payType || [],
            paidType: relatedData?.data?.paidType || [],
            stateType: relatedData?.data?.stateType || []
          }
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.loadOrders();
      });
  }

  async onDownloadInvoice(invoiceId: number): Promise<void> {
    const res = await this._invoicePrintService['_invoiceService']
      .getInvoiceToEdit(invoiceId)
      .toPromise();
    this.invoiceToPrintData = res?.data;
    setTimeout(() => {
      if (this.invoiceToPrintRef?.nativeElement && this.invoiceToPrintData) {
        this._invoicePrintService.downloadInvoice(
          this.invoiceToPrintData as any,
          this.invoiceToPrintRef.nativeElement
        );
      }
    }, 300);
  }

  openDeleteOrderDialog(id: number): void {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Deseas eliminar esta orden?',
        message: 'Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.deleteOrder(id);
      }
    });
  }

  private deleteOrder(orderId: number): void {
    this.loading = true;
    this.orders = [];
    this._invoiceService.deleteInvoice(orderId).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (error: unknown) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }
}
