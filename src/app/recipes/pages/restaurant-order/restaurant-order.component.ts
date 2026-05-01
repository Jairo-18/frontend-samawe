import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { SeeOrdersComponent } from '../../components/see-orders/see-orders.component';
import { CreateOrEditOrderComponent } from '../../components/create-or-edit-order/create-or-edit-order.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-restaurant-order',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    BasePageComponent,
    SeeOrdersComponent,
    CreateOrEditOrderComponent,
    TranslateModule
  ],
  templateUrl: './restaurant-order.component.html',
  styleUrls: ['./restaurant-order.component.scss']
})
export class RestaurantOrderComponent {}
