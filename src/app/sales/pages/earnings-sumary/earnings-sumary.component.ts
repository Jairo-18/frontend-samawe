import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule, formatDate, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { EarningService } from '../../services/earning.service';
import {
  ProductSummary,
  InvoiceBalance,
  TotalInventory,
  DashboardStateSummary,
  DashboardPeriodValue,
  SalesDashboard
} from '../../interface/earning.interface';
import { NgChartsModule } from 'ng2-charts';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { BreakdownDonutComponent } from '../../components/breakdown-donut/breakdown-donut.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SalesTrendChartComponent } from '../../components/sales-trend-chart/sales-trend-chart.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { ReceivableRow } from '../../../invoices/interface/invoiceCredit.interface';
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
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    BreakdownDonutComponent,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    LoaderComponent,
    SalesTrendChartComponent,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './earnings-sumary.component.html',
  styleUrl: './earnings-sumary.component.scss'
})
export class EarningsSumaryComponent implements OnInit {
  private readonly _earningService: EarningService = inject(EarningService);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _router: Router = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _translate = inject(TranslateService);

  /** Ventas a crédito, saldadas y no (`includePaid`), ya netas de notas. */
  receivables: ReceivableRow[] = [];
  /** `loading` mientras se piden; `failed` oculta las tarjetas (informativas). */
  receivablesState: 'loading' | 'loaded' | 'failed' = 'loading';
  productSummary?: ProductSummary;
  inventoryTotal?: TotalInventory;
  invoiceBalance?: InvoiceBalance;
  /** Cifras del período y su serie (calculadas en el servidor). */
  dashboard?: SalesDashboard;
  /** `idle`: período libre sin las dos fechas elegidas todavía. */
  dashboardState: 'idle' | 'loading' | 'loaded' | 'failed' = 'loading';
  /** Rango del período "Personalizado". */
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });
  readonly today = new Date();
  /** Productos con poco stock (informativo; si falla, la tarjeta no aparece). */
  lowInventory: { name: string; amount: number }[] = [];
  lowInventoryTotal = 0;
  lowInventoryState: 'loading' | 'loaded' | 'failed' = 'loading';
  dashboardSummary?: DashboardStateSummary;
  isLoading: boolean = true;
  selectedPeriod: DashboardPeriodValue = 'daily';
  readonly periods = [
    { label: 'Diario', value: 'daily' },
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'yearly' }
  ] as const;
  ngOnInit(): void {
    this.loadStaticData();
    this.loadReceivables();
    this.loadLowInventory();
    this.loadDashboard(this.selectedPeriod);
  }

  private loadLowInventory(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    this._earningService.getLowInventory().subscribe({
      next: (res) => {
        this.lowInventory = (res.data ?? []).map((p) => ({
          name: p.name?.['es'] ?? Object.values(p.name ?? {})[0] ?? '—',
          amount: Number(p.amount)
        }));
        this.lowInventoryTotal = res.pagination?.total ?? this.lowInventory.length;
        this.lowInventoryState = 'loaded';
      },
      error: () => {
        this.lowInventoryState = 'failed';
      }
    });
  }

  /** "CERVEZA CORONA" → "Cerveza corona". */
  pretty(value: string): string {
    const lower = (value ?? '').toLocaleLowerCase('es-CO');
    return lower.charAt(0).toLocaleUpperCase('es-CO') + lower.slice(1);
  }

  /** Balance guardado del período; el rango libre no tiene (solo existe en vivo). */
  get periodBalance() {
    return this.selectedPeriod === 'custom'
      ? undefined
      : this.invoiceBalance?.[this.selectedPeriod];
  }

  /** % de hospedajes ocupados sobre los que están en servicio. */
  get occupancyPercent(): number {
    const usable =
      this.availableAccommodationsCount +
      this.occupiedAccommodationsCount +
      this.reservedAccommodationsCount;
    return usable > 0
      ? Math.round(
          ((this.occupiedAccommodationsCount + this.reservedAccommodationsCount) /
            usable) *
            100
        )
      : 0;
  }

  /**
   * Antigüedad de lo que nos deben: lo vencido se mide desde la primera cuota
   * vencida sin pagar; lo demás está al día o aún sin plazo.
   */
  get aging(): { labelKey: string; total: number; count: number; tone: string }[] {
    const buckets = {
      current: { labelKey: 'sales.aging_current', total: 0, count: 0, tone: '' },
      d30: { labelKey: 'sales.aging_30', total: 0, count: 0, tone: '!text-[var(--warning)]' },
      d60: { labelKey: 'sales.aging_60', total: 0, count: 0, tone: '!text-[var(--danger)]' },
      d90: { labelKey: 'sales.aging_90', total: 0, count: 0, tone: '!text-[var(--danger)]' },
      noTerm: { labelKey: 'sales.aging_no_term', total: 0, count: 0, tone: '' }
    };
    const todayMs = Date.UTC(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate()
    );
    for (const r of this.owingInvoices) {
      let target = buckets.current;
      if (r.status === 'NO_TERM') {
        target = buckets.noTerm;
      } else if (r.status === 'OVERDUE' && r.oldestOverdueDate) {
        const [y, m, d] = r.oldestOverdueDate.slice(0, 10).split('-').map(Number);
        const late = Math.floor((todayMs - Date.UTC(y, m - 1, d)) / 86_400_000);
        target = late > 60 ? buckets.d90 : late > 30 ? buckets.d60 : buckets.d30;
      }
      target.total += r.balance;
      target.count += 1;
    }
    return Object.values(buckets).filter((b) => b.count > 0);
  }
  /**
   * Cartera de crédito. Es informativa: si falla (p. ej. un rol sin acceso a
   * cuentas por cobrar) las tarjetas simplemente no aparecen y el resto del
   * resumen sigue funcionando.
   */
  private loadReceivables(): void {
    // Solo en el navegador, como `EarningService`: en el servidor no hay sesión,
    // la petición fallaba, el HTML salía sin el loader y al hidratar el cliente
    // (que arranca en `loading`) no coincidía — las tarjetas no llegaban a pintarse.
    if (!isPlatformBrowser(this._platformId)) return;
    this._invoiceService.getReceivables(true).subscribe({
      next: (res) => {
        this.receivables = res.data ?? [];
        this.receivablesState = 'loaded';
      },
      error: () => {
        this.receivablesState = 'failed';
      }
    });
  }

  private sumOf(rows: ReceivableRow[], key: 'total' | 'paid' | 'balance'): number {
    return rows.reduce((sum, r) => sum + Number(r[key] ?? 0), 0);
  }

  /** Vendido a crédito (total a pagar, neto de notas). */
  get creditSold(): number {
    return this.sumOf(this.receivables, 'total');
  }

  /** Lo que ya se cobró de esas ventas. */
  get creditCollected(): number {
    return this.sumOf(this.receivables, 'paid');
  }

  /** Lo que nos deben. */
  get creditOwed(): number {
    return this.sumOf(this.receivables, 'balance');
  }

  /** Porcentaje cobrado de lo vendido a crédito (0–100). */
  get creditCollectedPct(): number {
    return this.creditSold > 0
      ? Math.round((this.creditCollected / this.creditSold) * 100)
      : 0;
  }

  /** Facturas que aún deben algo, vencidas primero (así llegan del backend). */
  get owingInvoices(): ReceivableRow[] {
    return this.receivables.filter((r) => r.balance > 0);
  }

  get overdueOwed(): number {
    return this.sumOf(
      this.owingInvoices.filter((r) => r.status === 'OVERDUE'),
      'balance'
    );
  }

  get overdueCount(): number {
    return this.owingInvoices.filter((r) => r.status === 'OVERDUE').length;
  }

  openReceivable(row: ReceivableRow): void {
    this._router.navigate(['/invoice/invoices', row.invoiceId, 'edit']);
  }

  openProducts(): void {
    this._router.navigate(['/service-and-product/general']);
  }

  openReceivables(): void {
    this._router.navigate(['/invoice/invoices/receivables']);
  }

  get activeProductsCount(): number {
    return Number(
      this.dashboardSummary?.products?.find((p) => p.isActive)?.count ?? 0
    );
  }
  get inactiveProductsCount(): number {
    return Number(
      this.dashboardSummary?.products?.find((p) => !p.isActive)?.count ?? 0
    );
  }
  get availableAccommodationsCount(): number {
    return Number(
      this.dashboardSummary?.accommodations?.find(
        (a) => a.state === 'Disponible' || a.state === 'DISPONIBLE'
      )?.count ?? 0
    );
  }
  get maintenanceAccommodationsCount(): number {
    return Number(
      this.dashboardSummary?.accommodations?.find(
        (a) => a.state === 'Mantenimiento' || a.state === 'MANTENIMIENTO'
      )?.count ?? 0
    );
  }
  get occupiedAccommodationsCount(): number {
    return Number(
      this.dashboardSummary?.accommodations?.find(
        (a) => a.state === 'Ocupado' || a.state === 'OCUPADO'
      )?.count ?? 0
    );
  }
  get noServiceAccommodationsCount(): number {
    return Number(
      this.dashboardSummary?.accommodations?.find(
        (a) =>
          a.state === 'Fuera de Servicio' || a.state === 'FUERA DE SERVICIO'
      )?.count ?? 0
    );
  }
  get reservedAccommodationsCount(): number {
    return this.dashboardSummary?.reservedAccommodations?.length ?? 0;
  }
  getSelectedPeriodLabel(): string {
    const labels: Record<string, string> = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual',
      custom: this._translate.instant('sales.custom')
    };
    return labels[this.selectedPeriod] || this.selectedPeriod;
  }
  onPeriodChange(period: DashboardPeriodValue): void {
    if (this.selectedPeriod === period) return;
    this.selectedPeriod = period;
    if (period === 'custom' && !this.range.value.start) {
      // Primera vez: los últimos 30 días, para no mostrar la pantalla vacía.
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      this.range.setValue({ start, end });
    }
    this.loadDashboard(period);
  }

  /** Al completar las dos fechas del rango libre. */
  onRangeChange(): void {
    if (this.selectedPeriod === 'custom') this.loadDashboard('custom');
  }
  private loadStaticData(): void {
    this.isLoading = true;
    forkJoin({
      productSummary: this._earningService.getGeneragetProductSummary(),
      invoiceBalance: this._earningService.getInvoiceBalance(),
      inventoryTotal: this._earningService.getTotalInventory(),
      dashboardSummary: this._earningService.getDashboardGeneralSummary()
    }).subscribe({
      next: (res) => {
        const {
          productSummary,
          invoiceBalance,
          inventoryTotal,
          dashboardSummary
        } = res;
        if (
          !productSummary ||
          !invoiceBalance ||
          !inventoryTotal ||
          !dashboardSummary
        ) {
          this.isLoading = false;
          return;
        }
        this.productSummary = productSummary;
        this.invoiceBalance = invoiceBalance;
        this.inventoryTotal = inventoryTotal;
        this.dashboardSummary = dashboardSummary;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
  private loadDashboard(period: DashboardPeriodValue): void {
    // Solo en el navegador (no hay sesión en el servidor; ver `loadReceivables`).
    if (!isPlatformBrowser(this._platformId)) return;

    let range: { from: string; to: string } | undefined;
    if (period === 'custom') {
      const { start, end } = this.range.value;
      if (!start || !end) {
        this.dashboardState = 'idle';
        return;
      }
      range = {
        from: formatDate(start, 'yyyy-MM-dd', 'en-US'),
        to: formatDate(end, 'yyyy-MM-dd', 'en-US')
      };
    }

    this.dashboardState = 'loading';
    this._earningService.getDashboard(period, range).subscribe({
      next: (dashboard) => {
        // Si el usuario cambió de período mientras tanto, esta respuesta es vieja.
        if (period !== this.selectedPeriod) return;
        this.dashboard = dashboard;
        this.dashboardState = 'loaded';
      },
      error: () => {
        if (period !== this.selectedPeriod) return;
        this.dashboardState = 'failed';
      }
    });
  }

  /** Cuatro cifras de la franja; la quinta (por cobrar) sale de la cartera. */
  get kpis(): {
    labelKey: string;
    value: number;
    valueClass: string;
    delta: { text: string; cls: string } | null;
    count?: number;
  }[] {
    const d = this.dashboard;
    if (!d) return [];
    const c = d.current;
    const p = d.previous;
    return [
      {
        labelKey: 'sales.sales',
        value: c.sales,
        valueClass: '',
        delta: this.delta(c.sales, p.sales, 'good-up')
      },
      {
        labelKey: 'sales.purchases',
        value: c.purchases,
        valueClass: '',
        delta: this.delta(c.purchases, p.purchases, 'neutral')
      },
      {
        labelKey: 'sales.kpi_result',
        value: c.result,
        valueClass: c.result < 0 ? '!text-[var(--danger)]' : '!text-[var(--success)]',
        delta: this.delta(c.result, p.result, 'good-up')
      },
      {
        labelKey: 'sales.kpi_ticket',
        value: c.salesCount > 0 ? c.sales / c.salesCount : 0,
        valueClass: '',
        delta: null,
        count: c.salesCount
      }
    ];
  }

  /**
   * Variación contra el período anterior. `good-up`: subir es bueno (verde) y
   * bajar malo (rojo); `neutral`: una compra más alta no es ni buena ni mala,
   * solo se informa (en ámbar).
   */
  private delta(
    current: number,
    previous: number,
    tone: 'good-up' | 'neutral'
  ): { text: string; cls: string } | null {
    if (current === 0 && previous === 0) return null;
    if (previous === 0) {
      return { text: '▲ ' + this._translate.instant('sales.delta_new'), cls: '!text-[var(--info)]' };
    }
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    const up = pct >= 0;
    const cls =
      tone === 'neutral'
        ? '!text-[var(--warning)]'
        : up
          ? '!text-[var(--success)]'
          : '!text-[var(--danger)]';
    return { text: `${up ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)}%`, cls };
  }

  /** Clave del texto "vs ayer / semana pasada / mes pasado / año pasado". */
  get vsPreviousKey(): string {
    return `sales.vs_${this.selectedPeriod}`;
  }
  payReport() {
    this._earningService.downloadPayReport();
  }
  detaillsReport() {
    this._earningService.downloadDetailsReport();
  }
}
