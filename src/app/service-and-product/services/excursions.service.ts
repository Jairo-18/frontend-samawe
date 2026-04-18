import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  CreateExcursionPanel,
  ExcursionComplete,
  ExcursionListResponse
} from '../interface/excursion.interface';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import {
  PaginationInterface,
  BasePaginationParams
} from '../../shared/interfaces/pagination.interface';
import { AuthService } from '../../auth/services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class ExcursionsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  private readonly _authService: AuthService = inject(AuthService);
  getExcursionWithPagination(query: BasePaginationParams): Observable<{
    pagination: PaginationInterface;
    data: CreateExcursionPanel[];
  }> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      query.organizationalId = orgId;
    }
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      pagination: PaginationInterface;
      data: CreateExcursionPanel[];
    }>(`${environment.apiUrl}excursion/paginated-list`, { params });
  }
  getAllExcursions(): Observable<{ data: ExcursionListResponse }> {
    const orgId = this._authService.getOrganizationalId();
    const params = orgId
      ? this._httpUtilities.httpParamsFromObject({ organizationalId: orgId })
      : undefined;
    return this._httpClient.get<{ data: ExcursionListResponse }>(
      `${environment.apiUrl}excursion`,
      { params }
    );
  }
  getExcursionEditPanel(
    excursionId: number
  ): Observable<ApiResponseInterface<ExcursionComplete>> {
    return this._httpClient.get<ApiResponseInterface<ExcursionComplete>>(
      `${environment.apiUrl}excursion/${excursionId}`
    );
  }
  createExcursionPanel(
    excursion: CreateExcursionPanel
  ): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      excursion.organizationalId = orgId;
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}excursion/create`,
      excursion
    );
  }
  updateExcursionPanel(excursionId: number, body: unknown): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}excursion/${excursionId}`,
      body
    );
  }
  deleteExcursionPanel(excursionId: number): Observable<unknown> {
    return this._httpClient.delete(
      `${environment.apiUrl}excursion/${excursionId}`
    );
  }
}

