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
import { SalesBreakdownItem } from '../../interface/earning.interface';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { ThemeService } from '../../../shared/services/theme.service';
import { formatCop } from '../../../shared/utilities/currency.utilities.service';

Chart.register(...registerables);

interface LegendRow {
  name: string;
  total: number;
  percent: number;
  color: string;
}

/**
 * Dona con su leyenda: de dónde vienen las ventas (por categoría o por forma de
 * pago). La leyenda es HTML y no la de Chart.js porque así lleva el valor y el
 * porcentaje de cada porción, que es lo que se quiere leer.
 *
 * Las porciones suman las ventas del período: el servidor las calcula con el
 * mismo neteo de notas que la cifra de "Ventas".
 */
@Component({
  selector: 'app-breakdown-donut',
  standalone: true,
  imports: [NgChartsModule, TranslateModule, FormatCopPipe],
  templateUrl: './breakdown-donut.component.html',
  styleUrl: './breakdown-donut.component.scss'
})
export class BreakdownDonutComponent implements OnChanges {
  /** Clave i18n del título de la tarjeta. */
  @Input() titleKey = '';
  @Input() items: SalesBreakdownItem[] = [];

  chartData?: ChartData<'doughnut'>;
  chartOptions?: ChartOptions<'doughnut'>;
  rows: LegendRow[] = [];

  private readonly _theme = inject(ThemeService);
  private readonly _translate = inject(TranslateService);
  private readonly _platformId = inject(PLATFORM_ID);

  constructor() {
    // Colores literales (canvas) que se recalculan al cambiar de tema.
    effect(() => {
      this._theme.isDark;
      this.chartOptions = this.buildOptions();
      this.build();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) this.build();
  }

  /** Paleta: el color de marca primero y tonos distinguibles después. */
  private palette(): string[] {
    const brand = this.css('--brand', '#486e2b');
    return [
      brand,
      '#d97706',
      '#2563eb',
      '#7c3aed',
      '#db2777',
      '#0891b2',
      '#65a30d',
      '#9ca3af'
    ];
  }

  private css(name: string, fallback: string): string {
    if (!isPlatformBrowser(this._platformId)) return fallback;
    return (
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
      fallback
    );
  }

  /** "EFECTIVO Y TRANSFERENCIA" → "Efectivo y transferencia". */
  private pretty(item: SalesBreakdownItem): string {
    if (item.key === 'DEBIT_NOTES') {
      return this._translate.instant('sales.cat_debit_notes');
    }
    const lower = (item.name ?? '').toLocaleLowerCase('es-CO');
    return lower.charAt(0).toLocaleUpperCase('es-CO') + lower.slice(1);
  }

  private build(): void {
    const total = this.items.reduce((s, i) => s + i.total, 0);
    const colors = this.palette();
    this.rows = this.items.map((item, i) => ({
      name: this.pretty(item),
      total: item.total,
      percent: total > 0 ? (item.total / total) * 100 : 0,
      color: colors[i % colors.length]
    }));
    this.chartData = this.rows.length
      ? {
          labels: this.rows.map((r) => r.name),
          datasets: [
            {
              data: this.rows.map((r) => r.total),
              backgroundColor: this.rows.map((r) => r.color),
              borderWidth: 0
            }
          ]
        }
      : undefined;
  }

  private buildOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCop(Number(ctx.parsed))}`
          }
        }
      }
    };
  }
}
