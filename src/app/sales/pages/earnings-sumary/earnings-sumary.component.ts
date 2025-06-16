import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ChartConfiguration } from 'chart.js';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { EarningService } from '../../services/earning.service';
import {
  ProductSummary,
  InvoiceBalance,
  TotalInventory,
  InvoiceSummaryGroupedResponse
} from '../../interface/earning.interface';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-earnings-sumary',
  standalone: true,
  imports: [
    BasePageComponent,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    NgChartsModule
  ],
  templateUrl: './earnings-sumary.component.html',
  styleUrl: './earnings-sumary.component.scss'
})
export class EarningsSumaryComponent implements OnInit {
  private readonly _earningService: EarningService = inject(EarningService);

  productSummary?: ProductSummary;
  inventoryTotal?: TotalInventory;
  invoiceBalance?: InvoiceBalance;
  invoiceSummaryGroup?: InvoiceSummaryGroupedResponse;

  selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';

  // Gráfica Chart.js
  chartData?: ChartConfiguration<'bar'>['data'];
  chartType: 'bar' = 'bar';
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit(): void {
    forkJoin({
      productSummary: this._earningService.getGeneragetProductSummary(),
      invoiceBalance: this._earningService.getInvoiceBalance(),
      inventoryTotal: this._earningService.getTotalInventory(),
      invoiceSummaryGroup: this._earningService.getGroupedInvoices()
    }).subscribe({
      next: (res) => {
        this.productSummary = res.productSummary;
        this.invoiceBalance = res.invoiceBalance;
        this.inventoryTotal = res.inventoryTotal;
        this.invoiceSummaryGroup = res.invoiceSummaryGroup;
        this.updateChart();
      },
      error: (err) => {
        console.error('Error al cargar los datos de ganancias:', err);
      }
    });
  }

  onPeriodChange(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): void {
    this.selectedPeriod = period;
    this.updateChart();
  }

  private updateChart(): void {
    if (this.invoiceSummaryGroup) {
      this.chartData = this.buildChartData(
        this.invoiceSummaryGroup,
        this.selectedPeriod
      );
    }
  }

  private buildChartData(
    data: InvoiceSummaryGroupedResponse,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): ChartConfiguration<'bar'>['data'] {
    const grouped = data[period];
    const labels = grouped.map((_, i) => `#${i + 1}`);
    const saleData: number[] = [];
    const buyData: number[] = [];

    grouped.forEach((item) => {
      if (item.type === 'FV') {
        saleData.push(item.total);
        buyData.push(0);
      } else if (item.type === 'FC') {
        saleData.push(0);
        buyData.push(item.total);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data: saleData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        },
        {
          label: 'Compras',
          data: buyData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }
      ]
    };
  }
}
