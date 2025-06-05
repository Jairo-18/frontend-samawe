import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import { Observable } from 'rxjs';
import { CreateInvoice, Invoice } from '../interface/invoice.interface';
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

  getInvoiceToEdit(id: number): Observable<ApiResponseInterface<Invoice>> {
    return this._httpClient.get<ApiResponseInterface<Invoice>>(
      `${environment.apiUrl}invoices/${id}`
    );
  }

  createInvoice(
    invoice: CreateInvoice
  ): Observable<ApiResponseCreateInterface> {
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices/create`,
      invoice
    );
  }

  deleteInvoice(invoiceId: number): Observable<unknown> {
    return this._httpClient.delete(
      `${environment.apiUrl}invoices/${invoiceId}`
    );
  }
}
