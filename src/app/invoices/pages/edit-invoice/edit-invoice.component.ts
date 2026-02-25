import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AddProductComponent } from '../../components/add-product/add-product.component';
import { AddAccommodationComponent } from '../../components/add-accommodation/add-accommodation.component';
import { AddExcursionComponent } from '../../components/add-excursion/add-excursion.component';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  AdditionalType,
  AppRelatedData,
  CategoryType,
  DiscountType,
  PaidType,
  PayType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import { Invoice } from '../../interface/invoice.interface';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceDetaillComponent } from '../../components/invoice-detaill/invoice-detaill.component';
import { InvoiceSummaryComponent } from '../../components/invoice-summary/invoice-summary.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { InvoicePdfComponent } from '../../components/invoice-pdf/invoice-pdf.component';
import html2pdf from 'html2pdf.js';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CreateInvoiceDialogComponent } from '../../components/create-invoice-dialog/create-invoice-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddInvoiceBuyComponent } from '../../components/add-invoice-buy/add-invoice-buy.component';
import { AddInvoiceBuyExcursionComponent } from '../../components/add-invoice-buy-excursion/add-invoice-buy-excursion.component';
import { PendingInvoiceDetail } from '../../interface/pending-item.interface';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PendingItemsTableComponent } from '../../components/pending-items-table/pending-items-table';
@Component({
  selector: 'app-edit-invoice',
  standalone: true,
  imports: [
    CommonModule,
    BasePageComponent,
    MatTabsModule,
    AddProductComponent,
    AddAccommodationComponent,
    AddExcursionComponent,
    InvoiceDetaillComponent,
    InvoiceSummaryComponent,
    LoaderComponent,
    InvoicePdfComponent,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    AddInvoiceBuyComponent,
    AddInvoiceBuyExcursionComponent,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PendingItemsTableComponent
  ],
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.scss']
})
export class EditInvoiceComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _dialog: MatDialog = inject(MatDialog);
  @ViewChild('invoiceToPrint') invoicePdfComp!: ElementRef;
  @ViewChild(InvoiceDetaillComponent)
  invoiceDetaillComponent!: InvoiceDetaillComponent;
  categoryTypes: CategoryType[] = [];
  paidTypes: PaidType[] = [];
  taxeTypes: TaxeType[] = [];
  payTypes: PayType[] = [];
  additionalTypes: AdditionalType[] = [];
  discountTypes: DiscountType[] = [];
  reloadInvoiceDetails: boolean = false;
  invoiceData?: Invoice;
  invoiceId?: number;
  initialLoading: boolean = true;
  ngOnInit(): void {
    const invoiceId = Number(this._route.snapshot.paramMap.get('id'));
    if (invoiceId) {
      this.getInvoiceToEdit(invoiceId);
    }
  }
  loadRelatedData(): void {
    if (this._relatedDataService.relatedData()) {
      this.processData(this._relatedDataService.relatedData()!.data);
    } else {
      this._relatedDataService.getRelatedData().subscribe({
        next: (res) => this.processData(res.data),
        error: (err) =>
          console.error('❌ Error al cargar datos relacionados:', err)
      });
    }
  }
  private processData(data: AppRelatedData): void {
    this.categoryTypes = data.categoryType || [];
    this.payTypes = data.payType || [];
    this.paidTypes = data.paidType || [];
    this.taxeTypes = data.taxeType || [];
    this.additionalTypes = data.additionalType || [];
    this.discountTypes = data.discountType || [];
  }
  onItemSaved(): void {
    if (this.invoiceId) {
      this.getInvoiceToEdit(this.invoiceId, false);
    }
  }
  openEditInvoiceDialog(): void {
    if (!this.invoiceId) return;
    const isMobile = window.innerWidth <= 768;
    this._dialog
      .open(CreateInvoiceDialogComponent, {
        width: isMobile ? '90vw' : '60vw',
        data: {
          editMode: true,
          invoiceId: this.invoiceId,
          relatedData: {
            payType: this.payTypes,
            paidType: this.paidTypes
          }
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.getInvoiceToEdit(this.invoiceId!, false);
      });
  }
  onItemDeleted(): void {
    if (this.invoiceId) {
      this.getInvoiceToEdit(this.invoiceId, false);
      this.reloadInvoiceDetails = true;
      setTimeout(() => (this.reloadInvoiceDetails = false), 100);
    }
  }
  getInvoiceToEdit(invoiceId: number, isInitialLoad: boolean = true): void {
    this._invoiceService.getInvoiceToEdit(invoiceId).subscribe({
      next: (res) => {
        const invoice = res.data;
        this.invoiceData = {
          ...invoice,
          invoiceDetails: [...invoice.invoiceDetails]
        };
        this.invoiceId = invoice.invoiceId;
        this.loadRelatedData();
        if (isInitialLoad) {
          this.initialLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al obtener la factura', err);
        if (isInitialLoad) {
          this.initialLoading = false;
        }
      }
    });
  }
  async downloadInvoice(): Promise<void> {
    const element = this.invoicePdfComp?.nativeElement;
    if (!element || !this.invoiceData) return;
    const options = {
      margin: 0.5,
      filename: `${this.invoiceData.invoiceType.code}-${this.invoiceData.code}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    await html2pdf().set(options).from(element).save();
  }
  onAllItemsSaved(): void {
    if (this.invoiceId) {
      this.getInvoiceToEdit(this.invoiceId, false);
    }
  }
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );
  pendingItems: PendingInvoiceDetail[] = [];
  isSavingItems: boolean = false;
  onPendingItem(item: PendingInvoiceDetail): void {
    this.pendingItems = [...this.pendingItems, item];
  }
  removePendingItem(index: number): void {
    this.pendingItems.splice(index, 1);
    this.pendingItems = [...this.pendingItems];
  }
  saveAllPendingItems(): void {
    if (!this.pendingItems.length || !this.invoiceId) return;
    this.isSavingItems = true;
    const payloads = this.pendingItems.map((i) => i.payload);
    this._invoiceDetaillService
      .createInvoiceDetaill(this.invoiceId, payloads)
      .subscribe({
        next: () => {
          this.pendingItems = [];
          this.isSavingItems = false;
          this.getInvoiceToEdit(this.invoiceId!, false);
          this.reloadInvoiceDetails = true;
          setTimeout(() => (this.reloadInvoiceDetails = false), 100);
        },
        error: (err) => {
          console.error('❌ Error al guardar items masivos:', err);
          this.isSavingItems = false;
        }
      });
  }
  toggleAllPayments(isPaid: boolean): void {
    if (!this.invoiceId || !this.invoiceData?.invoiceDetails.length) return;
    this.initialLoading = true;
    const detailsToUpdate = this.invoiceData.invoiceDetails
      .filter((d) => d.isPaid !== isPaid)
      .map((d) => d.invoiceDetailId);
    if (detailsToUpdate.length === 0) {
      this.initialLoading = false;
      return;
    }
    this._invoiceDetaillService
      .toggleDetailPaymentBulk(this.invoiceId, detailsToUpdate, isPaid)
      .subscribe({
        next: () => {
          this.getInvoiceToEdit(this.invoiceId!, false);
          this.initialLoading = false;
        },
        error: (err: any) => {
          console.error('Error al actualizar estado masivo', err);
          this.initialLoading = false;
        }
      });
  }
}

