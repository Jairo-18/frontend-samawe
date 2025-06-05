import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // 👈 Importa ActivatedRoute
import { CommonModule } from '@angular/common'; // 👈 Importa CommonModule para directivas como *ngIf, *ngFor y pipes
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
import { Invoice } from '../../interface/invoice.interface'; // Asegúrate que esta interfaz coincida con tu JSON
import { InvoiceService } from '../../services/invoice.service';
import { ApiResponseInterface } from '../../../shared/interfaces/api-response.interface';
import { InvoiceDetaillComponent } from '../../components/invoice-detaill/invoice-detaill.component';
import { InvoiceSummaryComponent } from '../../components/invoice-summary/invoice-summary.component';

@Component({
  selector: 'app-edit-invoice',
  standalone: true, // Asumiendo que es un componente standalone por las importaciones directas
  imports: [
    CommonModule, // 👈 Añade CommonModule aquí
    BasePageComponent,
    MatTabsModule,
    AddProductComponent,
    AddAccommodationComponent,
    AddExcursionComponent,
    InvoiceDetaillComponent,
    InvoiceSummaryComponent
  ],
  templateUrl: './edit-invoice.component.html',
  styleUrl: './edit-invoice.component.scss'
})
export class EditInvoiceComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute); // 👈 Inyecta ActivatedRoute

  categoryTypes: CategoryType[] = [];
  paidTypes: PaidType[] = [];
  taxeTypes: TaxeType[] = [];
  payTypes: PayType[] = [];

  invoiceData?: Invoice;
  invoiceId?: number;

  ngOnInit(): void {
    this.loadRelatedData();

    const invoiceId = Number(this._route.snapshot.paramMap.get('id'));
    if (invoiceId) {
      this.getInvoiceToEdit(invoiceId);
    }
  }

  loadRelatedData(): void {
    this._relatedDataService.createInvoiceRelatedData().subscribe({
      next: (res) => {
        this.categoryTypes = res.data.categoryType || [];
        this.payTypes = res.data.payType || [];
        this.paidTypes = res.data.paidType || [];
        this.taxeTypes = res.data.taxeType || [];
      },
      error: (err) =>
        console.error('❌ Error al cargar datos relacionados:', err)
    });
  }

  getInvoiceToEdit(invoiceId: number): void {
    this._invoiceService.getInvoiceToEdit(invoiceId).subscribe({
      next: (response: ApiResponseInterface<Invoice>) => {
        this.invoiceData = response.data;
        console.log('✅ Factura cargada correctamente:', this.invoiceData);
      },
      error: (error) => {
        console.error('❌ Error al cargar la factura:', error);
        this.invoiceData = undefined; // Limpia en caso de error para evitar mostrar datos incorrectos
      }
    });
  }
}
