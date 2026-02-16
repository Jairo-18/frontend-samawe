import { createInvoiceRelatedData } from './../../invoices/interface/invoice.interface';
import {
  CreateUserRelatedData,
  RegisterUserRelatedData
} from './../../auth/interfaces/register.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment';
import { CreateAccommodationRelatedData } from '../../service-and-product/interface/accommodation.interface';
import { PhoneCode } from '../interfaces/relatedDataGeneral';

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
  private _invoiceRelatedData =
    signal<ApiResponseInterface<createInvoiceRelatedData> | null>(null);
  readonly invoiceRelatedData = this._invoiceRelatedData.asReadonly();

  registerUserRelatedData(): Observable<
    ApiResponseInterface<RegisterUserRelatedData>
  > {
    return this._httpClient.get<ApiResponseInterface<RegisterUserRelatedData>>(
      `${environment.apiUrl}user/register/related-data`
    );
  }

  createUserRelatedData(): Observable<
    ApiResponseInterface<CreateUserRelatedData>
  > {
    return this._httpClient.get<ApiResponseInterface<CreateUserRelatedData>>(
      `${environment.apiUrl}user/create/related-data`
    );
  }

  createAccommodationRelatedData(): Observable<
    ApiResponseInterface<CreateAccommodationRelatedData>
  > {
    return this._httpClient.get<
      ApiResponseInterface<CreateAccommodationRelatedData>
    >(`${environment.apiUrl}accommodation/create/related-data`);
  }

  createInvoiceRelatedData(
    forceRefresh: boolean = false
  ): Observable<ApiResponseInterface<createInvoiceRelatedData>> {
    // Si ya tenemos datos y no se fuerza refresco, devolvemos los datos existentes
    if (!forceRefresh && this._invoiceRelatedData()) {
      return of(this._invoiceRelatedData()!);
    }

    return this._httpClient
      .get<ApiResponseInterface<createInvoiceRelatedData>>(
        `${environment.apiUrl}invoices/create/related-data`
      )
      .pipe(
        tap((response) => {
          // Almacenamos la respuesta en la signal
          this._invoiceRelatedData.set(response);
        })
      );
  }

  // Método para limpiar la caché si es necesario
  clearInvoiceRelatedDataCache(): void {
    this._invoiceRelatedData.set(null);
  }

  /**
   * Búsqueda paginada de códigos de país
   * @param search - Término de búsqueda (busca en code y name)
   * @param page - Número de página (default: 1)
   * @param perPage - Elementos por página (default: 10)
   */
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
