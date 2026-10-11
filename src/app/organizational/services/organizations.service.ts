import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import {
  PlatformOrganization,
  SaveOrganization
} from '../../shared/interfaces/organizational.interface';

/**
 * CRUD de organizaciones (hoteles) para el SUPER ADMINISTRADOR.
 *
 * Es distinto de `ApplicationService`, que edita la organización PROPIA del
 * usuario (pantalla "Aplicación"). Aquí se listan y administran todas; el
 * backend solo lo permite a SUPERADMIN / PLATFORM_ADMIN.
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationsService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _base = `${environment.apiUrl}organizational`;

  getAll(): Observable<ApiResponseInterface<PlatformOrganization[]>> {
    return this._http.get<ApiResponseInterface<PlatformOrganization[]>>(
      this._base
    );
  }

  create(
    data: SaveOrganization
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      this._base,
      data
    );
  }

  update(
    id: string,
    data: SaveOrganization
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${this._base}/${id}`,
      data
    );
  }

  delete(id: string): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(`${this._base}/${id}`);
  }
}
