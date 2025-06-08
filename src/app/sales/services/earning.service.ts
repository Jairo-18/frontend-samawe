import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import {
  InvoiceStatsResponse,
  SalesSummaryByCategory,
  Total,
  TotalInventory
} from '../interface/earning.interface';

@Injectable({
  providedIn: 'root'
})
export class EarningService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  getGeneralEanings(): Observable<InvoiceStatsResponse> {
    return this._httpClient.get<InvoiceStatsResponse>(
      `${environment.apiUrl}earning/general-earnigs`
    );
  }

  getCountTotalItems(): Observable<SalesSummaryByCategory> {
    return this._httpClient.get<SalesSummaryByCategory>(
      `${environment.apiUrl}earning/count-total-items`
    );
  }

  getTotalInventory(): Observable<TotalInventory> {
    return this._httpClient.get<TotalInventory>(
      `${environment.apiUrl}earning/inventory-total`
    );
  }

  getTotalWithInventory(): Observable<Total> {
    return this._httpClient.get<Total>(
      `${environment.apiUrl}earning/total-sales-with-inventory`
    );
  }
}
