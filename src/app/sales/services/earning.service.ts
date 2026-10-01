import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import {
  ProductSummary,
  InvoiceBalance,
  TotalInventory,
  InvoiceSummaryGroupedResponse,
  DashboardStateSummary,
  DashboardPeriodValue,
  LowInventoryResponse,
  SalesDashboard
} from '../interface/earning.interface';
import { AuthService } from '../../auth/services/auth.service';

const CACHE_TTL_MS = 5 * 60 * 1000;
/** El tablero tiene las ventas de HOY: 5 minutos de retraso confundirían ("acabo de facturar y no sale"). */
const DASHBOARD_CACHE_MS = 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class EarningService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _cache = new Map<string, { obs$: Observable<unknown>; ts: number; ttl: number }>();

  constructor() {
    this._authService._isLoggedSubject.subscribe(isLogged => {
      if (!isLogged) this._cache.clear();
    });
  }

  private _cached<T>(
    key: string,
    factory: () => Observable<T>,
    ttl: number = CACHE_TTL_MS
  ): Observable<T> {
    const cached = this._cache.get(key);
    if (cached && Date.now() - cached.ts < cached.ttl) {
      return cached.obs$ as Observable<T>;
    }
    const obs$ = factory().pipe(shareReplay(1));
    this._cache.set(key, { obs$, ts: Date.now(), ttl });
    return obs$;
  }

  getGeneragetProductSummary(): Observable<ProductSummary> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/product-summary?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/product-summary`;
    return this._cached('product-summary', () => this._httpClient.get<ProductSummary>(url));
  }
  getInvoiceBalance(): Observable<InvoiceBalance> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/invoice-summary?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/invoice-summary`;
    return this._cached('invoice-summary', () => this._httpClient.get<InvoiceBalance>(url));
  }
  /** Cifras del período, comparación con el anterior y serie, ya sumadas en el servidor. */
  getDashboard(
    period: DashboardPeriodValue,
    range?: { from: string; to: string }
  ): Observable<SalesDashboard> {
    const query =
      period === 'custom' && range
        ? `period=custom&from=${range.from}&to=${range.to}`
        : `period=${period}`;
    return this._cached(
      `dashboard-${query}`,
      () =>
        this._httpClient.get<SalesDashboard>(
          `${environment.apiUrl}balance/dashboard?${query}`
        ),
      DASHBOARD_CACHE_MS
    );
  }

  /** Los 5 productos con menos stock (el backend considera "bajo" menos de 10). */
  getLowInventory(): Observable<LowInventoryResponse> {
    return this._cached('inventory-low', () =>
      this._httpClient.get<LowInventoryResponse>(
        `${environment.apiUrl}balance/paginated-list-inventory-low?page=1&perPage=5`
      )
    );
  }
  getTotalInventory(): Observable<TotalInventory> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/total-stock?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/total-stock`;
    return this._cached('total-stock', () => this._httpClient.get<TotalInventory>(url));
  }
  getGroupedInvoices(): Observable<InvoiceSummaryGroupedResponse> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/invoice-chart-list?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/invoice-chart-list`;
    return this._cached('invoice-chart-list', () => this._httpClient.get<InvoiceSummaryGroupedResponse>(url));
  }
  getDashboardGeneralSummary(): Observable<DashboardStateSummary> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/general?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/general`;
    return this._cached('balance-general', () => this._httpClient.get<DashboardStateSummary>(url));
  }
  private downloadExcelFromResponse(
    response: HttpResponse<Blob>,
    defaultName: string
  ): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const blob = response.body;
    if (!blob) return;
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = defaultName;
    if (contentDisposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
        contentDisposition
      );
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/['"]/g, '').trim());
      }
    }
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    if (!filename.includes(formattedDate)) {
      const dotIndex = filename.lastIndexOf('.');
      if (dotIndex !== -1) {
        const base = filename.substring(0, dotIndex);
        const ext = filename.substring(dotIndex);
        filename = `${base}_${formattedDate}${ext}`;
      } else {
        filename = `${filename}_${formattedDate}`;
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  downloadPayReport(): void {
    this._httpClient
      .get(`${environment.apiUrl}reports/payment-types/excel`, {
        responseType: 'blob',
        observe: 'response'
      })
      .subscribe({
        next: (response) =>
          this.downloadExcelFromResponse(response, 'reporte_pagos.xlsx'),
        error: (error) =>
          console.error('Error al descargar reporte de pagos:', error)
      });
  }
  downloadDetailsReport(): void {
    this._httpClient
      .get(
        `${environment.apiUrl}reports/sales-by-category/with-details/excel`,
        {
          responseType: 'blob',
          observe: 'response'
        }
      )
      .subscribe({
        next: (response) =>
          this.downloadExcelFromResponse(
            response,
            'reporte_detallado_items.xlsx'
          ),
        error: (error) =>
          console.error('Error al descargar reporte de detalles:', error)
      });
  }
  getPayReportBlob(): Observable<Blob> {
    return this._httpClient.get(
      `${environment.apiUrl}reports/payment-types/excel`,
      { responseType: 'blob' }
    );
  }
  getDetailsReportBlob(): Observable<Blob> {
    return this._httpClient.get(
      `${environment.apiUrl}reports/sales-by-category/with-details/excel`,
      { responseType: 'blob' }
    );
  }
}

