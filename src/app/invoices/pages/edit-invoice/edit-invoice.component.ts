import { Component } from '@angular/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AddProductComponent } from '../../components/add-product/add-product.component';
import { AddAccommodationComponent } from '../../components/add-accommodation/add-accommodation.component';
import { AddExcursionComponent } from '../../components/add-excursion/add-excursion.component';

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
export class EditInvoiceComponent {}
