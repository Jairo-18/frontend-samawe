import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ChartConfiguration } from 'chart.js';

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

  readonly periods = [
    { label: 'Diario', value: 'daily' },
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'yearly' }
  ] as const;

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
    this.loadEarningsData(this.selectedPeriod);
  }

  onPeriodChange(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): void {
    this.selectedPeriod = period;
    this.loadEarningsData(period);
  }

  private loadEarningsData(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): void {
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

  private updateChart(): void {
    if (this.invoiceSummaryGroup?.[this.selectedPeriod]) {
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

    if (!grouped) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = grouped.map((_, i) => `#${i + 1}`);
    const saleData: number[] = [];
    const buyData: number[] = [];

    grouped.forEach((item) => {
      const total = item.total ?? 0;
      if (item.type === 'FV') {
        saleData.push(total);
        buyData.push(0);
      } else if (item.type === 'FC') {
        saleData.push(0);
        buyData.push(total);
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
