import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule, formatDate } from '@angular/common';
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
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-earnings-sumary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    NgChartsModule,
    FormatCopPipe,
    BasePageComponent,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonToggleModule
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
    this.loadStaticData(); // solo una vez
    this.loadGroupedInvoices(this.selectedPeriod); // periodo inicial
  }

  getSelectedPeriodLabel(): string {
    const labels: Record<string, string> = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual'
    };
    return labels[this.selectedPeriod] || this.selectedPeriod;
  }

  onPeriodChange(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): void {
    if (this.selectedPeriod === period) return; // evita peticiones innecesarias
    this.selectedPeriod = period;
    this.loadGroupedInvoices(period);
  }

  private loadStaticData(): void {
    forkJoin({
      productSummary: this._earningService.getGeneragetProductSummary(),
      invoiceBalance: this._earningService.getInvoiceBalance(),
      inventoryTotal: this._earningService.getTotalInventory()
    }).subscribe({
      next: ({ productSummary, invoiceBalance, inventoryTotal }) => {
        this.productSummary = productSummary;
        this.invoiceBalance = invoiceBalance;
        this.inventoryTotal = inventoryTotal;
      },
      error: (err) =>
        console.error('Error al cargar datos estáticos de resumen:', err)
    });
  }

  private loadGroupedInvoices(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): void {
    this._earningService.getGroupedInvoices().subscribe({
      next: (grouped) => {
        this.invoiceSummaryGroup = grouped;
        this.updateChart();
      },
      error: (err) =>
        console.error('Error al cargar resumen de facturas agrupadas:', err)
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

  private formatFullDate(date: string | undefined): string {
    if (!date) return '';
    return formatDate(date, 'dd/MM/yyyy HH:mm', 'es-CO'); // Ej: 16/06/2025 10:58
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

    const labels: string[] = [];
    const saleData: number[] = [];
    const buyData: number[] = [];

    grouped.forEach((item) => {
      const label = `${item.type ?? '??'} - ${
        item.code ?? 'N/A'
      } - ${this.formatFullDate(item.createdAt)}`;

      const total = item.total ?? 0;
      labels.push(label);

      if (item.type === 'FV') {
        saleData.push(total);
        buyData.push(0);
      } else if (item.type === 'FC') {
        saleData.push(0);
        buyData.push(total);
      } else {
        saleData.push(0);
        buyData.push(0);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data: saleData,
          backgroundColor: '#06a606'
        },
        {
          label: 'Compras',
          data: buyData,
          backgroundColor: '#fe0000'
        }
      ]
    };
  }

  private formatLabel(
    date: string | undefined,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): string {
    const locale = 'es-CO';
    if (!date) return '';

    switch (period) {
      case 'daily':
        return formatDate(date, 'dd/MM/yyyy', locale);
      case 'weekly':
        return 'Semana ' + formatDate(date, 'ww', locale); // Semana #
      case 'monthly':
        return formatDate(date, 'MMMM yyyy', locale); // Ej: junio 2025
      case 'yearly':
        return formatDate(date, 'yyyy', locale);
      default:
        return date;
    }
  }
}
