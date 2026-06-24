/* eslint-disable @typescript-eslint/no-explicit-any */
import { InvoiceService } from './../../services/invoice.service';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { CreateInvoiceDialogComponent } from '../../components/create-invoice-dialog/create-invoice-dialog.component';
import { CreditNoteDialogComponent } from '../../components/credit-note-dialog/credit-note-dialog.component';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { AuthService } from '../../../auth/services/auth.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { UserComplete } from '../../../organizational/interfaces/create.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MatMenuModule } from '@angular/material/menu';
import { InvoicePdfComponent } from '../../components/invoice-pdf/invoice-pdf.component';
import { Invoice } from '../../interface/invoice.interface';
import { InvoicePrintService } from '../../../shared/services/invoicePrint.service';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { NotificationsService } from '../../../shared/services/notifications.service';
@Component({
  selector: 'app-see-invoices',
  standalone: true,
  imports: [
    MatButtonModule,
    BasePageComponent,
    MatPaginatorModule,
    MatTabsModule,
    MatIconModule,
    CommonModule,
    SearchFieldsComponent,
    RouterLink,
    LoaderComponent,
    MatTableModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule,
    InvoicePdfComponent,
    FormatCopPipe,
    TranslateModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './see-invoices.component.html',
  styleUrl: './see-invoices.component.scss'
})
export class SeeInvoicesComponent implements OnInit {
  @ViewChild('invoiceToPrintRef') invoiceToPrintRef!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _translate: TranslateService = inject(TranslateService);
  private readonly _notifications: NotificationsService = inject(NotificationsService);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);

  /** Vista actual: cada ruta del side fija una categoría de factura. */
  category: 'electronic' | 'sales' | 'purchases' | 'quotes' = 'sales';
  /** Código de tipo de factura asociado a la categoría (FVE/FV/FC). */
  private categoryTypeCode = 'FV';
  /** Id del tipo de factura resuelto desde relatedData; filtra la lista. */
  private categoryTypeId: number | null = null;
  /**
   * Tipos de factura para el select del diálogo crear/editar. Se guarda aparte
   * de `searchFields` porque el split retira el filtro `invoiceTypeId` de la
   * barra de búsqueda (applyCategoryConfig) y antes el diálogo lo leía de ahí
   * vía getOptions → quedaba vacío. Ahora viene directo de relatedData.
   */
  private invoiceTypeOptions: any[] = [];
  pageTitleKey = 'invoice.list.title_sales';
  pageSubtitleKey = 'invoice.list.subtitle_sales';
  selectedInvoice: any = null;
  invoiceToPrintData?: Invoice;
  selectedInvoiceIds = new Set<number>();
  downloadingExcel: boolean = false;
  sendingFactusIds = new Set<number>();

  displayedColumns: string[] = [
    'select',
    'invoiceType',
    'code',
    'clientName',
    'employeeName',
    'startDate',
    'payType',
    'paidType',
    'stateType',
    'invoiceElectronic',
    'tableNumber',
    'totalVat',
    'totalIco8',
    'totalIco5',
    'subtotalWithoutTax',
    'subtotalWithTax',
    'total',
    'actions'
  ];
  form!: FormGroup;
  dataSource = new MatTableDataSource<any>([]);
  isMobile: boolean = false;
  loading: boolean = false;
  showClearButton: boolean = false;
  userLogged: UserInterface;
  params: any = {};
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
      label: 'invoice.list.search_text',
      type: 'text',
      placeholder: ' '
    },
    {
      name: 'startDate',
      label: 'invoice.list.search_date',
      type: 'date'
    },
    {
      name: 'invoiceTypeId',
      label: 'invoice.list.search_invoice_type',
      type: 'select',
      options: [],
      capitalizeOptions: true,
      placeholder: 'invoice.list.search_invoice_type_ph'
    },
    {
      name: 'paidTypeId',
      label: 'invoice.list.search_paid_status',
      type: 'select',
      options: [],
      capitalizeOptions: true,
      placeholder: 'invoice.list.search_paid_status_ph'
    },
    {
      name: 'payTypeId',
      label: 'invoice.list.search_pay_type',
      type: 'select',
      options: [],
      capitalizeOptions: true,
      placeholder: 'invoice.list.search_pay_type_ph'
    },
    {
      name: 'taxeTypeId',
      label: 'invoice.list.search_tax_type',
      type: 'select',
      options: [],
      placeholder: 'invoice.list.search_tax_type_ph'
    },
    {
      name: 'stateTypeId',
      label: 'invoice.list.search_order_status',
      type: 'select',
      options: [],
      capitalizeOptions: true,
      placeholder: 'invoice.list.search_order_status_ph'
    },
    {
      name: 'invoiceElectronic',
      label: 'invoice.list.search_electronic',
      type: 'select',
      options: [
        { value: 'true', label: 'invoice.list.search_yes' },
        { value: 'false', label: 'invoice.list.search_no' }
      ],
      placeholder: 'invoice.list.search_electronic_ph'
    }
  ];
  constructor(private _invoicePrintService: InvoicePrintService) {
    if (isPlatformBrowser(this._platformId)) {
      this.isMobile = window.innerWidth <= 768;
    }
    if (this.isMobile) this.paginationParams.perPage = 10;
    this.userLogged = this._authService.getUserLoggedIn();
  }
  ngOnInit(): void {
    this.applyCategoryConfig();
    // loadRelatedData resuelve el invoiceTypeId de la categoría y luego carga
    // las facturas (necesita el id antes de filtrar). Si falla, se cargan igual.
    this.loadRelatedData();
  }

  /** Configura la vista según la categoría fijada por la ruta. */
  private applyCategoryConfig(): void {
    const CATEGORY = {
      electronic: {
        code: 'FVE',
        title: 'invoice.list.title_electronic',
        subtitle: 'invoice.list.subtitle_electronic'
      },
      sales: {
        code: 'FV',
        title: 'invoice.list.title_sales',
        subtitle: 'invoice.list.subtitle_sales'
      },
      purchases: {
        code: 'FC',
        title: 'invoice.list.title_purchases',
        subtitle: 'invoice.list.subtitle_purchases'
      },
      quotes: {
        code: 'CO',
        title: 'invoice.list.title_quotes',
        subtitle: 'invoice.list.subtitle_quotes'
      }
    } as const;
    const fromRoute = this._route.snapshot.data['category'] as
      | 'electronic'
      | 'sales'
      | 'purchases'
      | 'quotes'
      | undefined;
    this.category = fromRoute ?? 'sales';
    const cfg = CATEGORY[this.category];
    this.categoryTypeCode = cfg.code;
    this.pageTitleKey = cfg.title;
    this.pageSubtitleKey = cfg.subtitle;
    // La categoría ya fija el tipo de factura: el filtro de tipo en la barra
    // de búsqueda sería redundante, así que se retira de esta vista.
    this.searchFields = this.searchFields.filter(
      (f) => f.name !== 'invoiceTypeId'
    );
    // En la vista electrónica todas las facturas son electrónicas por
    // definición, así que el filtro "electrónica sí/no" tampoco aporta.
    if (this.category === 'electronic') {
      this.searchFields = this.searchFields.filter(
        (f) => f.name !== 'invoiceElectronic'
      );
    }
  }
  loadRelatedData(): void {
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        const matchType = (res.data.invoiceType || []).find(
          (t: any) => t.code === this.categoryTypeCode
        );
        this.categoryTypeId = matchType
          ? Number(matchType.invoiceTypeId)
          : null;
        this.invoiceTypeOptions = res.data.invoiceType || [];
        this.loadInvoices();
        const optionMap = {
          invoiceTypeId: res.data.invoiceType,
          identificationTypeId: res.data.identificationType,
          paidTypeId: res.data.paidType,
          payTypeId: res.data.payType,
          taxeTypeId: res.data.taxeType,
          stateTypeId: res.data.stateType
        };
        this.searchFields = this.searchFields.map((field) => {
          const key = field.name as keyof typeof optionMap;
          const options = optionMap[key];
          if (options) {
            let filteredOptions: any[] = options;
            if (key === 'stateTypeId') {
              filteredOptions = options.filter((state: any) =>
                [6, 7, 8, 9, 10].includes(Number(state.stateTypeId))
              );
            }

            return {
              ...field,
              options: filteredOptions.map((t: any) => ({
                value: t[key],
                label: t.name ?? 'Sin nombre'
              }))
            };
          }
          return field;
        });
      },
      error: (err) => {
        console.error('Error loading related data', err);
        this.loadInvoices();
      }
    });
  }
  openCreateDialog(): void {
    const isMobile = isPlatformBrowser(this._platformId)
      ? window.innerWidth <= 768
      : false;
    this._matDialog
      .open(CreateInvoiceDialogComponent, {
        width: isMobile ? '90vw' : '60vw',
        data: {
          editMode: false,
          relatedData: {
            invoiceType: this.invoiceTypeOptions,
            payType: this.getOptions('payTypeId'),
            paidType: this.getOptions('paidTypeId'),
            stateType: this.getOptions('stateTypeId')
          }
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.loadInvoices();
      });
  }
  openEditDialog(invoiceId: number): void {
    const isMobile = isPlatformBrowser(this._platformId)
      ? window.innerWidth <= 768
      : false;
    this._matDialog
      .open(CreateInvoiceDialogComponent, {
        width: isMobile ? '90vw' : '60vw',
        data: {
          editMode: true,
          invoiceId: invoiceId,
          relatedData: {
            invoiceType: this.invoiceTypeOptions,
            payType: this.getOptions('payTypeId'),
            paidType: this.getOptions('paidTypeId'),
            stateType: this.getOptions('stateTypeId')
          }
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.loadInvoices();
      });
  }
  openCreditNoteDialog(invoice: any): void {
    if (!invoice?.factusNumber) return;
    const isMobile = isPlatformBrowser(this._platformId)
      ? window.innerWidth <= 768
      : false;
    this._matDialog.open(CreditNoteDialogComponent, {
      width: isMobile ? '95vw' : '560px',
      maxWidth: '95vw',
      data: {
        invoiceId: invoice.invoiceId,
        invoiceCode: invoice.code,
        factusNumber: invoice.factusNumber
      }
    });
  }

  private getOptions(fieldName: string): any[] {
    const field = this.searchFields.find((f) => f.name === fieldName);
    return (
      field?.options?.map((opt) => ({
        [fieldName.replace('Id', '') + 'Id']: Number(opt.value),
        name: opt.label
      })) || []
    );
  }
  onSearchSubmit(values: any): void {
    this.params = this.formatParams(values);
    this.paginationParams.page = 1;
    this.loadInvoices();
  }
  onSearchChange(form: any): void {
    this.showClearButton = !!form.length;
    this.params = this.formatParams(form?.value);
    this.paginationParams.page = 1;
    this.loadInvoices();
  }
  private formatParams(values: any): any {
    const formattedParams: any = {};
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
  private formatDateISO(date: any): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }
  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadInvoices();
  }
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }
  loadInvoices(filter: string = ''): void {
    this.loading = true;
    const query: any = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      search: filter,
      ...this.params
    };
    // La categoría de la vista manda: siempre filtra por su tipo de factura.
    if (this.categoryTypeId) {
      query.invoiceTypeId = this.categoryTypeId;
    }
    this._invoiceService.getInvoiceWithPagination(query).subscribe({
      next: (res) => {
        const transformedData = res.data.map((invoice: any) => ({
          ...invoice,
          clientName: invoice.user
            ? `${invoice.user.firstName} ${invoice.user.lastName}`
            : '---',
          clientIdentification: invoice.user?.identificationNumber || '---',
          observations: invoice.observations,
          clientIdentificationType:
            invoice.user?.identificationType?.name || '---',
          employeeName: invoice.employee
            ? `${invoice.employee.firstName} ${invoice.employee.lastName}`
            : '---',
          tableNumber: invoice.tableNumber ?? null,
          stateType: invoice.stateType?.name?.['es'] ?? null,
          taxeType: invoice.invoiceDetails?.[0]?.taxeType || null,
          invoiceElectronic:
            invoice.invoiceElectronic === true ||
            invoice.invoiceElectronic === 'true' ||
            invoice.invoiceElectronic === 1,
          factusNumber: invoice.factusNumber ?? null
        }));
        this.dataSource.data = transformedData;
        this.paginationParams = res?.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }
  private deleteInvoice(invoiceId: number): void {
    this.loading = true;
    this._invoiceService.deleteInvoice(invoiceId).subscribe({
      next: () => {
        this.loadInvoices();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }
  openDeleteInvoiceDialog(id: number): void {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: this._translate.instant('invoice.list.delete_title'),
        message: this._translate.instant('invoice.list.delete_msg')
      }
    });
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.deleteInvoice(id);
      }
    });
  }
  validateIfCanEditUserOrDelete(user: UserComplete): boolean {
    return (
      (this.userLogged?.roleType?.name as any)?.['es']?.toUpperCase() === 'ADMINISTRADOR' ||
      ((this.userLogged?.roleType?.name as any)?.['es']?.toUpperCase() === 'ADMINISTRADOR' &&
        (user.roleType?.name as any)?.['es']?.toUpperCase() === 'CLIENTE') ||
      (user.roleType?.name as any)?.['es']?.toUpperCase() === 'CLIENTE'
    );
  }
  async onPrintInvoice(invoiceId: number): Promise<void> {
    const res = await this._invoicePrintService['_invoiceService']
      .getInvoiceToEdit(invoiceId)
      .toPromise();
    this.invoiceToPrintData = res?.data;
    setTimeout(() => {
      if (this.invoiceToPrintRef?.nativeElement && this.invoiceToPrintData) {
        this._invoicePrintService.promptAndPrint(this.invoiceToPrintData);
      }
    }, 300);
  }
  sendInvoiceToFactus(invoice: any): void {
    if (invoice.factusNumber || this.sendingFactusIds.has(invoice.invoiceId)) return;
    this.sendingFactusIds.add(invoice.invoiceId);
    this._invoiceService.sendToFactus(invoice.invoiceId).subscribe({
      next: (res) => {
        this.sendingFactusIds.delete(invoice.invoiceId);
        invoice.factusNumber = res.data?.billNumber ?? res.data?.referenceCode ?? 'SENT';
        this._notifications.showNotification(
          'success',
          'invoice.list.factus_success_msg',
          'invoice.list.factus_success_title'
        );
      },
      error: (err) => {
        this.sendingFactusIds.delete(invoice.invoiceId);
        const msg = err?.error?.message ?? 'invoice.list.factus_error_title';
        this._notifications.showNotification('error', msg, 'invoice.list.factus_error_title');
      }
    });
  }

  async onDownloadInvoice(invoiceId: number): Promise<void> {
    const res = await this._invoicePrintService['_invoiceService']
      .getInvoiceToEdit(invoiceId)
      .toPromise();
    this.invoiceToPrintData = res?.data;
    setTimeout(() => {
      if (this.invoiceToPrintRef?.nativeElement && this.invoiceToPrintData) {
        this._invoicePrintService.promptAndDownload(this.invoiceToPrintData);
      }
    }, 300);
  }

  isSelected(invoiceId: number): boolean {
    return this.selectedInvoiceIds.has(invoiceId);
  }

  toggleSelection(invoiceId: number): void {
    if (this.selectedInvoiceIds.has(invoiceId)) {
      this.selectedInvoiceIds.delete(invoiceId);
    } else {
      this.selectedInvoiceIds.add(invoiceId);
    }
  }

  get mobileColumns(): string[] {
    return this.displayedColumns.filter((c) => c !== 'select');
  }

  get currentPageIds(): number[] {
    return this.dataSource.data.map((inv: any) => inv.invoiceId);
  }

  isAllCurrentPageSelected(): boolean {
    return (
      this.currentPageIds.length > 0 &&
      this.currentPageIds.every((id) => this.selectedInvoiceIds.has(id))
    );
  }

  isIndeterminate(): boolean {
    const selected = this.currentPageIds.filter((id) =>
      this.selectedInvoiceIds.has(id)
    );
    return selected.length > 0 && selected.length < this.currentPageIds.length;
  }

  toggleAllCurrentPage(): void {
    if (this.isAllCurrentPageSelected()) {
      this.currentPageIds.forEach((id) => this.selectedInvoiceIds.delete(id));
    } else {
      this.currentPageIds.forEach((id) => this.selectedInvoiceIds.add(id));
    }
  }

  clearSelection(): void {
    this.selectedInvoiceIds.clear();
  }

  downloadSelectedExcel(): void {
    if (this.selectedInvoiceIds.size === 0) return;
    if (!isPlatformBrowser(this._platformId)) return;
    this.downloadingExcel = true;
    const ids = Array.from(this.selectedInvoiceIds);
    this._invoiceService.downloadSelectedInvoicesExcel(ids).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const fecha = now.toLocaleDateString('es-CO').replace(/\//g, '-');
        a.href = url;
        a.download = `Facturas_Seleccionadas_${fecha}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingExcel = false;
      },
      error: () => {
        this.downloadingExcel = false;
      }
    });
  }
}
