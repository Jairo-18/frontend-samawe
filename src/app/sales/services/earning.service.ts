import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  ProductSummary,
  InvoiceBalance,
  TotalInventory,
  InvoiceSummaryGroupedResponse,
  DashboardStateSummary
} from '../interface/earning.interface';

@Injectable({
  providedIn: 'root'
})
export class EarningService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  getGeneragetProductSummary(): Observable<ProductSummary> {
    return this._httpClient.get<ProductSummary>(
      `${environment.apiUrl}balance/product-summary`
    );
  }

  getInvoiceBalance(): Observable<InvoiceBalance> {
    return this._httpClient.get<InvoiceBalance>(
      `${environment.apiUrl}balance/invoice-summary`
    );
  }

  getTotalInventory(): Observable<TotalInventory> {
    return this._httpClient.get<TotalInventory>(
      `${environment.apiUrl}balance/total-stock`
    );
  }

  getGroupedInvoices(): Observable<InvoiceSummaryGroupedResponse> {
    return this._httpClient.get<InvoiceSummaryGroupedResponse>(
      `${environment.apiUrl}balance/invoice-chart-list`
    );
  }

  getDashboardGeneralSummary(): Observable<DashboardStateSummary> {
    return this._httpClient.get<DashboardStateSummary>(
      `${environment.apiUrl}balance/general`
    );
  }

  private downloadExcelFromResponse(response: any, defaultName: string): void {
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
