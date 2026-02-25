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
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  getInvoiceWithPagination(query: object): Observable<{
    pagination: PaginationInterface;
    data: CreateInvoice[];
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      pagination: PaginationInterface;
      data: CreateInvoice[];
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
}

