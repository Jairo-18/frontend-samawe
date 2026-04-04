import { inject, Injectable } from '@angular/core';
import {
  AccommodationComplete,
  CreateAccommodationPanel,
  GetAccommodationPaginatedList,
  MostRequestedAccommodation
} from '../interface/accommodation.interface';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { HttpClient } from '@angular/common/http';
import {
  PaginationInterface,
  BasePaginationParams
} from '../../shared/interfaces/pagination.interface';
import { AuthService } from '../../auth/services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class AccommodationsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  private readonly _authService: AuthService = inject(AuthService);
  getAccommodationWithPagination(query: BasePaginationParams): Observable<{
    pagination: PaginationInterface;
    data: GetAccommodationPaginatedList[];
  }> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      query.organizationalId = orgId;
    }
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      pagination: PaginationInterface;
      data: GetAccommodationPaginatedList[];
    }>(`${environment.apiUrl}accommodation/paginated-list`, { params });
  }
  getAccommodationEditPanel(
    accommodationId: number
  ): Observable<ApiResponseInterface<AccommodationComplete>> {
    return this._httpClient.get<ApiResponseInterface<AccommodationComplete>>(
      `${environment.apiUrl}accommodation/${accommodationId}`
    );
  }
  createAccommodationPanel(
    accommodation: CreateAccommodationPanel
  ): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      accommodation.organizationalId = orgId;
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}accommodation/create`,
      accommodation
    );
  }
  updateAccommodationPanel(
    accommodationId: number,
    body: unknown
  ): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}accommodation/${accommodationId}`,
      body
    );
  }
  deleteAccommodationPanel(accommodationId: number): Observable<unknown> {
    return this._httpClient.delete(
      `${environment.apiUrl}accommodation/${accommodationId}`
    );
  }

  getMostRequested(): Observable<{ statusCode: number; data: MostRequestedAccommodation[] }> {
    return this._httpClient.get<{ statusCode: number; data: MostRequestedAccommodation[] }>(
      `${environment.apiUrl}accommodation/public/most-requested`
    );
  }
}

