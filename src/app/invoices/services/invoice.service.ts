import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { ApiResponseCreateInterface } from '../../shared/interfaces/api-response.interface';
import { Observable } from 'rxjs';
import { CreateInvoice } from '../interface/invoice.interface';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  createInvoice(
    invoice: CreateInvoice
  ): Observable<ApiResponseCreateInterface> {
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}invoices/create`,
      invoice
    );
  }
}
