import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment';
import { AppRelatedData, PhoneCode } from '../interfaces/relatedDataGeneral';
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
@Injectable({
  providedIn: 'root'
})
export class RelatedDataService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private _relatedData = signal<ApiResponseInterface<AppRelatedData> | null>(
    null
  );
  readonly relatedData = this._relatedData.asReadonly();
  getRelatedData(
    forceRefresh: boolean = false
  ): Observable<ApiResponseInterface<AppRelatedData>> {
    if (!forceRefresh && this._relatedData()) {
      return of(this._relatedData()!);
    }
    return this._httpClient
      .get<
        ApiResponseInterface<AppRelatedData>
      >(`${environment.apiUrl}app/related-data`)
      .pipe(
        tap((response) => {
          this._relatedData.set(response);
        })
      );
  }
  clearRelatedDataCache(): void {
    this._relatedData.set(null);
  }
  searchPhoneCodes(
    search: string = '',
    page: number = 1,
    perPage: number = 10
  ): Observable<PaginatedResponse<PhoneCode>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString())
      .set('order', 'ASC');
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this._httpClient.get<PaginatedResponse<PhoneCode>>(
      `${environment.apiUrl}user/paginated-phone-code`,
      { params }
    );
  }
}

