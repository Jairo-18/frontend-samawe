import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { AddProductComponent } from '../../../invoices/components/add-product/add-product.component';
import { PendingItemsTableComponent } from '../../../invoices/components/pending-items-table/pending-items-table';
import { InvoiceDetaillComponent } from '../../../invoices/components/invoice-detaill/invoice-detaill.component';
import { InvoiceSummaryComponent } from '../../../invoices/components/invoice-summary/invoice-summary.component';
import { AddAccommodationComponent } from '../../../invoices/components/add-accommodation/add-accommodation.component';
import { AddExcursionComponent } from '../../../invoices/components/add-excursion/add-excursion.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { InvoiceDetaillService } from '../../../invoices/services/invoiceDetaill.service';
import { Invoice } from '../../../invoices/interface/invoice.interface';
import { InvoiceType } from '../../../shared/interfaces/relatedDataGeneral';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { CreateInvoiceDialogComponent } from '../../../invoices/components/create-invoice-dialog/create-invoice-dialog.component';
import { PendingInvoiceDetail } from '../../../invoices/interface/pending-item.interface';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CategoryType,
  TaxeType,
  PayType,
  AdditionalType,
  DiscountType,
  PaidType,
  StateType
} from '../../../shared/interfaces/relatedDataGeneral';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [
    CommonModule,
    BasePageComponent,
    AddProductComponent,
    PendingItemsTableComponent,
    InvoiceDetaillComponent,
    InvoiceSummaryComponent,
    AddAccommodationComponent,
    AddExcursionComponent,
    LoaderComponent,
    MatTabsModule
  ],
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss']
})
export class EditOrderComponent implements OnInit {
  orderId?: number;
  invoiceData?: Invoice;
  pendingItems: PendingInvoiceDetail[] = [];

  initialLoading: boolean = true;
  reloadInvoiceDetails: boolean = false;
  isSavingItems: boolean = false;

  categoryTypes: CategoryType[] = [];
  invoiceTypes: InvoiceType[] = [];
  taxeTypes: TaxeType[] = [];
  payTypes: PayType[] = [];
  paidTypes: PaidType[] = [];
  stateTypes: StateType[] = [];
  additionalTypes: AdditionalType[] = [];
  discountTypes: DiscountType[] = [];

  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );
  private readonly _dialog: MatDialog = inject(MatDialog);

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    if (idParam) {
      this.orderId = Number(idParam);
      this.loadOrderData();
      this.loadRelatedData();
    }
  }

  loadRelatedData(): void {
    if (this._relatedDataService.relatedData()) {
      const data = this._relatedDataService.relatedData()!.data;
      this.categoryTypes = data.categoryType || [];
      this.invoiceTypes = data.invoiceType || [];
      this.taxeTypes = data.taxeType || [];
      this.payTypes = data.payType || [];
      this.paidTypes = data.paidType || [];
      this.stateTypes = data.stateType || [];
      this.additionalTypes = data.additionalType || [];
      this.discountTypes = data.discountType || [];
    } else {
      this._relatedDataService.getRelatedData().subscribe({
        next: (res) => {
          this.categoryTypes = res.data.categoryType || [];
          this.invoiceTypes = res.data.invoiceType || [];
          this.taxeTypes = res.data.taxeType || [];
          this.payTypes = res.data.payType || [];
          this.paidTypes = res.data.paidType || [];
          this.stateTypes = res.data.stateType || [];
          this.additionalTypes = res.data.additionalType || [];
          this.discountTypes = res.data.discountType || [];
        },
        error: (err: unknown) =>
          console.error('Error loading related data', err)
      });
    }
  }

  loadOrderData(isInitialLoad: boolean = true): void {
    if (!this.orderId) return;
    this._invoiceService.getInvoiceToEdit(this.orderId).subscribe({
      next: (res) => {
        const invoice = res.data;
        this.invoiceData = {
          ...invoice,
          invoiceDetails: [...invoice.invoiceDetails]
        };
        if (isInitialLoad) this.initialLoading = false;
      },
      error: (err: unknown) => {
        console.error('Error loading order', err);
        if (isInitialLoad) this.initialLoading = false;
      }
    });
  }

  onItemSaved(): void {
    this.loadOrderData(false);
  }

  onPendingItem(item: PendingInvoiceDetail): void {
    this.pendingItems = [...this.pendingItems, item];
  }

  removePendingItem(index: number): void {
    this.pendingItems.splice(index, 1);
    this.pendingItems = [...this.pendingItems];
  }

  saveAllPendingItems(): void {
    if (!this.pendingItems.length || !this.orderId) return;
    this.isSavingItems = true;
    const payloads = this.pendingItems.map((i) => i.payload);

    this._invoiceDetaillService
      .createInvoiceDetaill(this.orderId, payloads)
      .subscribe({
        next: () => {
          this.pendingItems = [];
          this.isSavingItems = false;
          this.loadOrderData(false);
          this.reloadInvoiceDetails = true;
          setTimeout(() => (this.reloadInvoiceDetails = false), 100);
        },
        error: (err: unknown) => {
          console.error('Error saving pending items:', err);
          this.isSavingItems = false;
        }
      });
  }

  onItemDeleted(): void {
    this.loadOrderData(false);
    this.reloadInvoiceDetails = true;
    setTimeout(() => (this.reloadInvoiceDetails = false), 100);
  }

  openEditInvoiceDialog(): void {
    if (!this.orderId) return;
    const isMobile = window.innerWidth <= 768;
    this._dialog
      .open(CreateInvoiceDialogComponent, {
        width: isMobile ? '90vw' : '60vw',
        data: {
          editMode: true,
          invoiceId: this.orderId,
          relatedData: {
            invoiceType: this.invoiceTypes,
            payType: this.payTypes,
            paidType: this.paidTypes,
            stateType: this.stateTypes
          }
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.loadOrderData(false);
      });
  }

  toggleAllPayments(isPaid: boolean): void {
    if (!this.orderId || !this.invoiceData?.invoiceDetails.length) return;
    this.initialLoading = true;
    const detailsToUpdate = this.invoiceData.invoiceDetails
      .filter((d) => d.isPaid !== isPaid)
      .map((d) => d.invoiceDetailId);

    if (detailsToUpdate.length === 0) {
      this.initialLoading = false;
      return;
    }

    this._invoiceDetaillService
      .toggleDetailPaymentBulk(this.orderId, detailsToUpdate, isPaid)
      .subscribe({
        next: () => {
          this.loadOrderData(false);
          this.initialLoading = false;
        },
        error: (err: unknown) => {
          console.error('Error updating bulk payments', err);
          this.initialLoading = false;
        }
      });
  }
}
