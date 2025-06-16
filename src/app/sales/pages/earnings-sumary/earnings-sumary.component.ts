import { Component, inject } from '@angular/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { EarningService } from '../../services/earning.service';
import {
  InvoiceStatsResponse,
  SalesSummaryByCategory,
  Total,
  TotalInventory
} from '../../interface/earning.interface';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-earnings-sumary',
  standalone: true,
  imports: [BasePageComponent, MatIconModule],
  templateUrl: './earnings-sumary.component.html',
  styleUrl: './earnings-sumary.component.scss'
})
export class EarningsSumaryComponent {
  private readonly _earningService: EarningService = inject(EarningService);

  invoiceStats?: InvoiceStatsResponse;
  totalitems?: SalesSummaryByCategory;
  inventoryTotal?: TotalInventory;
  totalWithInventory?: Total;

  // ngOnInit(): void {
  //   this.load();
  // }

  load() {
    this._earningService.getGeneralEanings().subscribe({
      next: (response) => {
        this.invoiceStats = response;
      },
      error: (err) => {
        console.error('Error al cargar los datos:', err);
      }
    });
    this._earningService.getCountTotalItems().subscribe({
      next: (response) => {
        this.totalitems = response;
      },
      error: (err) => {
        console.error('Error al cargar los datos:', err);
      }
    });
    this._earningService.getTotalInventory().subscribe({
      next: (response) => {
        this.inventoryTotal = response;
      },
      error: (err) => {
        console.error('Error al cargar los datos:', err);
      }
    });
    this._earningService.getTotalWithInventory().subscribe({
      next: (response) => {
        this.totalWithInventory = response;
      },
      error: (err) => {
        console.error('Error al cargar los datos:', err);
      }
    });
  }
}
