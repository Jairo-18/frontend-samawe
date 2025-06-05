import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { ApiResponseCreateInterface } from '../../shared/interfaces/api-response.interface';
import { CreateInvoiceDetaill } from '../interface/invoiceDetaill.interface';

@Injectable({ providedIn: 'root' })
export class InvoiceDetaillService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  createInvoiceDetaill(
    invoiceId: number,
    invoiceDetaill: CreateInvoiceDetaill
  ): Observable<ApiResponseCreateInterface> {
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices/${invoiceId}/details`,
      invoiceDetaill
    );
  }
}
