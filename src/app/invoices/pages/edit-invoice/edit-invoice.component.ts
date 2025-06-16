import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AddProductComponent } from '../../components/add-product/add-product.component';
import { AddAccommodationComponent } from '../../components/add-accommodation/add-accommodation.component';
import { AddExcursionComponent } from '../../components/add-excursion/add-excursion.component';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  CategoryType,
  PaidType,
  PayType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import {
  createInvoiceRelatedData,
  Invoice
} from '../../interface/invoice.interface';
import { InvoiceService } from '../../services/invoice.service';
import { ApiResponseInterface } from '../../../shared/interfaces/api-response.interface';
import { InvoiceDetaillComponent } from '../../components/invoice-detaill/invoice-detaill.component';
import { InvoiceSummaryComponent } from '../../components/invoice-summary/invoice-summary.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

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
    LoaderComponent
  ],
  templateUrl: './edit-invoice.component.html',
  styleUrl: './edit-invoice.component.scss'
})
export class EditInvoiceComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);

  categoryTypes: CategoryType[] = [];
  paidTypes: PaidType[] = [];
  taxeTypes: TaxeType[] = [];
  payTypes: PayType[] = [];
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
    if (this._relatedDataService.invoiceRelatedData()) {
      this.processData(this._relatedDataService.invoiceRelatedData()!);
    } else {
      this._relatedDataService.createInvoiceRelatedData().subscribe({
        next: (res) => this.processData(res),
        error: (err) =>
          console.error('❌ Error al cargar datos relacionados:', err)
      });
    }
  }

  private processData(
    res: ApiResponseInterface<createInvoiceRelatedData>
  ): void {
    this.categoryTypes = res.data.categoryType || [];
    this.payTypes = res.data.payType || [];
    this.paidTypes = res.data.paidType || [];
    this.taxeTypes = res.data.taxeType || [];
  }

  onProductAdded(): void {
    if (this.invoiceId) {
      this.getInvoiceToEdit(this.invoiceId, false);
      this.reloadInvoiceDetails = true;
      setTimeout(() => (this.reloadInvoiceDetails = false), 100);
    }
  }

  onAccommodationAdded(): void {
    if (this.invoiceId) {
      this.getInvoiceToEdit(this.invoiceId, false);
      this.reloadInvoiceDetails = true;
      setTimeout(() => (this.reloadInvoiceDetails = false), 100);
    }
  }

  onExcursionAdded(): void {
    if (this.invoiceId) {
      this.getInvoiceToEdit(this.invoiceId, false);
      this.reloadInvoiceDetails = true;
      setTimeout(() => (this.reloadInvoiceDetails = false), 100);
    }
  }

  onItemDelete(): void {
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
}
