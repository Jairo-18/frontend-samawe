import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import { Observable } from 'rxjs';
import {
  CreateInvoice,
  EditInvoice,
  InvoiceComplete
} from '../interface/invoice.interface';
import { CreateInvoiceDetaill } from '../interface/invoiceDetaill.interface';
import {
  CreateCreditNotePayload,
  CreditNote,
  CreditNoteResult
} from '../interface/creditNote.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import {
  PaginationInterface,
  BasePaginationParams
} from '../../shared/interfaces/pagination.interface';
import { AuthService } from '../../auth/services/auth.service';
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  private readonly _authService: AuthService = inject(AuthService);
  getInvoiceWithPagination(query: BasePaginationParams): Observable<{
    pagination: PaginationInterface;
    data: InvoiceComplete[];
  }> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      query.organizationalId = orgId;
    }
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      pagination: PaginationInterface;
      data: InvoiceComplete[];
    }>(`${environment.apiUrl}invoices/paginated-list`, { params });
  }
  getInvoiceToEdit(
    invoiceId: number
  ): Observable<ApiResponseInterface<InvoiceComplete>> {
    return this._httpClient.get<ApiResponseInterface<InvoiceComplete>>(
      `${environment.apiUrl}invoices/${invoiceId}`
    );
  }
  updateInvoice(
    invoiceId: number,
    body: Partial<EditInvoice>
  ): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}invoices/${invoiceId}`,
      body
    );
  }
  createInvoice(
    invoice: CreateInvoice
  ): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      invoice.organizationalId = orgId;
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices`,
      invoice
    );
  }
  deleteInvoice(invoiceId: number): Observable<unknown> {
    return this._httpClient.delete(
      `${environment.apiUrl}invoices/${invoiceId}`
    );
  }

  sendToFactus(invoiceId: number): Observable<{ success: boolean; data: any }> {
    return this._httpClient.post<{ success: boolean; data: any }>(
      `${environment.apiUrl}factus/invoices/${invoiceId}/send`,
      {}
    );
  }

  createCreditNote(
    invoiceId: number,
    body: CreateCreditNotePayload
  ): Observable<{ success: boolean; data: CreditNoteResult }> {
    return this._httpClient.post<{ success: boolean; data: CreditNoteResult }>(
      `${environment.apiUrl}factus/invoices/${invoiceId}/credit-notes`,
      body
    );
  }

  getCreditNotes(
    invoiceId: number
  ): Observable<{ success: boolean; data: CreditNote[] }> {
    return this._httpClient.get<{ success: boolean; data: CreditNote[] }>(
      `${environment.apiUrl}factus/invoices/${invoiceId}/credit-notes`
    );
  }

  downloadSelectedInvoicesExcel(invoiceIds: number[]): Observable<Blob> {
    return this._httpClient.post(
      `${environment.apiUrl}invoices/selected/excel`,
      { invoiceIds },
      { responseType: 'blob' }
    );
  }

  addDetails(
    invoiceId: number,
    details: CreateInvoiceDetaill[]
  ): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      details.forEach((d) => (d.organizationalId = orgId));
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices/invoice/${invoiceId}/details`,
      details
    );
  }
}
