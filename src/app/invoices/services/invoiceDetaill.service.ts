import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import {
  CreateInvoiceDetaill,
  TogglePaymentBulkResponse,
  TogglePaymentResponse
} from '../interface/invoiceDetaill.interface';
@Injectable({ providedIn: 'root' })
export class InvoiceDetaillService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _authService: AuthService = inject(AuthService);
  createInvoiceDetaill(
    invoiceId: number,
    invoiceDetaill: CreateInvoiceDetaill[]
  ): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      invoiceDetaill.forEach((d) => (d.organizationalId = orgId));
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices/invoice/${invoiceId}/details`,
      invoiceDetaill
    );
  }
  createInvoiceDetaillMultiple(
    invoiceId: number,
    invoiceDetails: CreateInvoiceDetaill[]
  ): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      invoiceDetails.forEach((d) => (d.organizationalId = orgId));
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices/invoice/${invoiceId}/details/bulk`,
      { details: invoiceDetails }
    );
  }
  deleteItemInvoice(invoiceDetailId: number): Observable<unknown> {
    return this._httpClient.delete(
      `${environment.apiUrl}invoices/details/${invoiceDetailId}`
    );
  }
  toggleDetailPayment(
    invoiceId: number,
    detailId: number
  ): Observable<ApiResponseInterface<TogglePaymentResponse>> {
    return this._httpClient.patch<ApiResponseInterface<TogglePaymentResponse>>(
      `${environment.apiUrl}invoices/invoice/${invoiceId}/detail/${detailId}/toggle-payment`,
      {}
    );
  }
  toggleDetailPaymentBulk(
    invoiceId: number,
    detailIds: number[],
    isPaid: boolean
  ): Observable<ApiResponseInterface<TogglePaymentBulkResponse>> {
    return this._httpClient.patch<
      ApiResponseInterface<TogglePaymentBulkResponse>
    >(
      `${environment.apiUrl}invoices/invoice/${invoiceId}/details/toggle-payment-bulk`,
      { detailIds, isPaid }
    );
  }
}

