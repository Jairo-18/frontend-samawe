import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department, Municipality } from '../interfaces/location.interface';

/**
 * Catálogo DANE (departamentos y municipios de Colombia). Consume el módulo
 * genérico de tipos del backend (GET /type/department|municipality/all).
 * Ambas listas se cachean: son estáticas y se reutilizan entre formularios.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  private _departments$?: Observable<Department[]>;
  private _municipalities$?: Observable<Municipality[]>;

  getDepartments(): Observable<Department[]> {
    if (!this._departments$) {
      this._departments$ = this._httpClient
        .get<{ data: Department[] }>(`${environment.apiUrl}type/department/all`)
        .pipe(
          map((res) => res.data ?? []),
          shareReplay(1)
        );
    }
    return this._departments$;
  }

  /** Todos los municipios (se filtran por departamento en el cliente). */
  getAllMunicipalities(): Observable<Municipality[]> {
    if (!this._municipalities$) {
      this._municipalities$ = this._httpClient
        .get<{ data: Municipality[] }>(
          `${environment.apiUrl}type/municipality/all`
        )
        .pipe(
          map((res) => res.data ?? []),
          shareReplay(1)
        );
    }
    return this._municipalities$;
  }
}
