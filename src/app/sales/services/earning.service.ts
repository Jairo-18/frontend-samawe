import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import {
  ProductSummary,
  InvoiceBalance,
  TotalInventory,
  InvoiceSummaryGroupedResponse,
  DashboardStateSummary
} from '../interface/earning.interface';
import { AuthService } from '../../auth/services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class EarningService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _authService: AuthService = inject(AuthService);
  getGeneragetProductSummary(): Observable<ProductSummary> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/product-summary?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/product-summary`;
    return this._httpClient.get<ProductSummary>(url);
  }
  getInvoiceBalance(): Observable<InvoiceBalance> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/invoice-summary?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/invoice-summary`;
    return this._httpClient.get<InvoiceBalance>(url);
  }
  getTotalInventory(): Observable<TotalInventory> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/total-stock?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/total-stock`;
    return this._httpClient.get<TotalInventory>(url);
  }
  getGroupedInvoices(): Observable<InvoiceSummaryGroupedResponse> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/invoice-chart-list?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/invoice-chart-list`;
    return this._httpClient.get<InvoiceSummaryGroupedResponse>(url);
  }
  getDashboardGeneralSummary(): Observable<DashboardStateSummary> {
    const orgId = this._authService.getOrganizationalId();
    const url = orgId
      ? `${environment.apiUrl}balance/general?organizationalId=${orgId}`
      : `${environment.apiUrl}balance/general`;
    return this._httpClient.get<DashboardStateSummary>(url);
  }
  private downloadExcelFromResponse(
    response: HttpResponse<Blob>,
    defaultName: string
  ): void {
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

