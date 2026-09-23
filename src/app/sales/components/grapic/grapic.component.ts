import {
  Component,
  effect,
  inject,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { InvoiceSummaryGroupedResponse } from '../../interface/earning.interface';
import { formatDate } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-grapic',
  standalone: true,
  imports: [NgChartsModule, MatTooltipModule, TranslateModule],
  templateUrl: './grapic.component.html',
  styleUrl: './grapic.component.scss'
})
export class GrapicComponent implements OnChanges {
  @Input() invoiceSummaryGroup?: InvoiceSummaryGroupedResponse;
  @Input() selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
  chartData?: ChartConfiguration<'bar'>['data'];
  chartType: 'bar' = 'bar';
  chartOptions: ChartConfiguration<'bar'>['options'];

  private readonly _theme: ThemeService = inject(ThemeService);

  /**
   * El gráfico se dibuja en un `<canvas>`, así que NO sigue las variables CSS
   * del tema: Chart.js necesita colores literales, calculados en JS. Sin
   * options propias caía en su gris por defecto —pensado para fondo claro—,
   * apenas legible sobre el fondo oscuro.
   *
   * Se recalcula con un `effect()` sobre la señal de `ThemeService`: al
   * cambiar de modo con el interruptor, el gráfico que ya está en pantalla se
   * repinta solo, sin esperar a que cambien los datos.
   */
  constructor() {
    effect(() => {
      this.chartOptions = this._buildChartOptions(this._theme.isDark);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['invoiceSummaryGroup'] || changes['selectedPeriod']) {
      this.updateChart();
    }
  }

  private _buildChartOptions(isDark: boolean): ChartConfiguration<'bar'>['options'] {
    const textColor = isDark ? '#9aa3ad' : '#374151';
    const gridColor = isDark ? '#2c333b' : '#e5e7eb';
    return {
      responsive: true,
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      },
      plugins: {
        legend: {
          labels: { color: textColor }
        }
      }
    };
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
    return formatDate(date, 'dd/MM hh:mm a', 'es-CO');
  }
  private buildChartData(
    data: InvoiceSummaryGroupedResponse,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): ChartConfiguration<'bar'>['data'] {
    const grouped = data[period];
    if (!grouped) return { labels: [], datasets: [] };
    const labels: string[] = [];
    const saleData: number[] = [];
    const buyData: number[] = [];
    grouped.forEach((item) => {
      const label = `${item.code ?? 'N/A'} - ${this.formatFullDate(
        item.createdAt
      )}`;
      labels.push(label);
      const total = item.total ?? 0;
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
}
