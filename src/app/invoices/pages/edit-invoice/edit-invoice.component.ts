import { Component, inject, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-edit-invoice',
  imports: [
    BasePageComponent,
    MatTabsModule,
    AddProductComponent,
    AddAccommodationComponent,
    AddExcursionComponent
  ],
  templateUrl: './edit-invoice.component.html',
  styleUrl: './edit-invoice.component.scss'
})
export class EditInvoiceComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);

  categoryTypes: CategoryType[] = [];
  paidTypes: PaidType[] = [];
  taxeTypes: TaxeType[] = [];
  payTypes: PayType[] = [];

  ngOnInit(): void {
    this.loadRelatedData();
  }

  loadRelatedData(): void {
    this._relatedDataService.createInvoiceRelatedData().subscribe({
      next: (res) => {
        this.categoryTypes = res.data.categoryType || [];
        this.payTypes = res.data.payType || [];
        this.paidTypes = res.data.paidType || [];
        this.taxeTypes = res.data.taxeType || [];
      },
      error: (err) => console.error('Error al cargar datos de select:', err)
    });
  }
}
