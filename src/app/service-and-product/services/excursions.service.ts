import { inject, Injectable } from '@angular/core';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  CreateExcursionPanel,
  ExcursionComplete
} from '../interface/excursion.interface';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ExcursionsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);

  getProductEditPanel(
    excursionId: number
  ): Observable<ApiResponseInterface<ExcursionComplete>> {
    return this._httpClient.get<ApiResponseInterface<ExcursionComplete>>(
      `${environment.apiUrl}excursion/${excursionId}`
    );
  }

  createProductPanel(
    excursion: CreateExcursionPanel
  ): Observable<ApiResponseCreateInterface> {
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}excursion/create`,
      excursion
    );
  }

  updateProductPanel(excursionId: number, body: unknown): Observable<void> {
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
