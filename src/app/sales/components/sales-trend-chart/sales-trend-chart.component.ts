import {
  Component,
  effect,
  inject,
  Input,
  OnChanges,
  PLATFORM_ID,
  SimpleChanges
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardPeriodValue, SalesDashboard } from '../../interface/earning.interface';
import { ThemeService } from '../../../shared/services/theme.service';
import { formatCop } from '../../../shared/utilities/currency.utilities.service';

// Una gráfica mixta (barras + línea) necesita los controladores de las dos
// series; se registran aquí para no depender de qué más haya cargado la app.
// Es idempotente.
Chart.register(...registerables);

type Period = DashboardPeriodValue;

/**
 * Ventas y compras en el tiempo, sumadas por hora (diario), día (semana y mes)
 * o mes (año), con la línea de las ventas del período anterior para comparar.
 *
 * Las cifras ya vienen sumadas y netas de notas desde el servidor
 * (`GET balance/dashboard`): aquí solo se dibuja. Antes era una barra por
 * factura, que en un mes o un año eran cientos de barras ilegibles.
 */
@Component({
  selector: 'app-sales-trend-chart',
  standalone: true,
  imports: [NgChartsModule, TranslateModule],
  templateUrl: './sales-trend-chart.component.html',
  styleUrl: './sales-trend-chart.component.scss'
})
export class SalesTrendChartComponent implements OnChanges {
  @Input() dashboard?: SalesDashboard;
  @Input() period: Period = 'monthly';

  chartData?: ChartData<'bar'>;
  chartOptions?: ChartOptions<'bar'>;

  private readonly _theme = inject(ThemeService);
  private readonly _translate = inject(TranslateService);
  private readonly _platformId = inject(PLATFORM_ID);

  constructor() {
    // Chart.js pinta en un <canvas> y necesita colores literales: se leen del
    // CSS en el navegador y se recalculan al cambiar de tema.
    effect(() => {
      const isDark = this._theme.isDark;
      this.chartOptions = this.buildOptions(isDark);
      this.chartData = this.buildData();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dashboard'] || changes['period']) {
      this.chartData = this.buildData();
    }
  }

  /** Color de una variable CSS (con respaldo en SSR, donde no hay `document`). */
  private css(name: string, fallback: string): string {
    if (!isPlatformBrowser(this._platformId)) return fallback;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  }

  /** Rótulo de una casilla, en hora de Colombia. */
  private label(iso: string): string {
    const date = new Date(iso);
    const fmt = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        ...options
      }).format(date);
    switch (this.period) {
      case 'daily':
        return fmt({ hour: 'numeric', hour12: true });
      case 'weekly':
        return fmt({ weekday: 'short', day: 'numeric' });
      case 'monthly':
        return fmt({ day: 'numeric' });
      case 'yearly':
        return fmt({ month: 'short' });
      case 'custom': {
        // Un rango largo (más de 92 días) viene agrupado por mes, uno corto por día.
        const range = this.dashboard?.range;
        const days = range
          ? (new Date(range.end).getTime() - new Date(range.start).getTime()) /
            86_400_000
          : 0;
        return days > 92
          ? fmt({ month: 'short', year: '2-digit' })
          : fmt({ day: 'numeric', month: 'short' });
      }
    }
  }

  private buildData(): ChartData<'bar'> | undefined {
    const series = this.dashboard?.series;
    if (!series) return undefined;

    const sales = this.css('--brand', '#486e2b');
    const purchases = this.css('--warning', '#d97706');
    const muted = this.css('--on-surface-muted', '#6b7280');

    // Las casillas que aún no llegan van como `null` (no como 0): así las barras
    // y la línea del período actual terminan donde estamos hoy, en vez de
    // dibujar un cero falso hacia el futuro.
    const datasets = [
      {
        type: 'bar',
        label: this._translate.instant('sales.sales'),
        data: series.map((b) => (b.future ? null : b.sales)),
        backgroundColor: sales,
        borderRadius: 4,
        order: 2
      },
      {
        type: 'bar',
        label: this._translate.instant('sales.purchases'),
        data: series.map((b) => (b.future ? null : b.purchases)),
        backgroundColor: purchases,
        borderRadius: 4,
        order: 3
      },
      {
        type: 'line',
        label: this._translate.instant('sales.previous_period'),
        data: series.map((b) => b.previousSales),
        borderColor: muted,
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        order: 1
      }
    ];

    return {
      labels: series.map((b) => this.label(b.start)),
      datasets: datasets as unknown as ChartData<'bar'>['datasets']
    };
  }

  private buildOptions(isDark: boolean): ChartOptions<'bar'> {
    const text = isDark ? '#9aa3ad' : '#374151';
    const grid = isDark ? '#2c333b' : '#e5e7eb';
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { ticks: { color: text, maxRotation: 0, autoSkip: true }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            color: text,
            // "1,2 M" y "350 mil" en vez de "1.200.000,00 COP" en cada marca.
            callback: (value) => compact(Number(value))
          },
          grid: { color: grid }
        }
      },
      plugins: {
        legend: { labels: { color: text, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${formatCop(Number(ctx.parsed.y ?? 0))}`
          }
        }
      }
    };
  }
}

/** Cifra abreviada para el eje: 1.200.000 → "1,2 M"; 350.000 → "350 mil". */
export function compact(value: number): string {
  const abs = Math.abs(value);
  const num = (n: number, digits: number) =>
    n.toLocaleString('es-CO', { maximumFractionDigits: digits });
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 1)} M`;
  if (abs >= 1_000) return `${num(value / 1_000, 0)} mil`;
  return num(value, 0);
}
