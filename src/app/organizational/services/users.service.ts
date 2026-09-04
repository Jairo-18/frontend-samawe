import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, shareReplay, tap } from 'rxjs';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import {
  ChangePassword,
  CreateUserPanel,
  UserComplete
} from '../interfaces/create.interface';
import {
  PaginationInterface,
  BasePaginationParams
} from '../../shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { AuthService } from '../../auth/services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _userPanelCache = new Map<string, Observable<ApiResponseInterface<UserComplete>>>();

  constructor() {
    this._authService._isLoggedSubject.subscribe(isLogged => {
      if (!isLogged) this._userPanelCache.clear();
    });
  }

  getUserWithPagination(query: BasePaginationParams): Observable<{
    pagination: PaginationInterface;
    data: UserComplete[];
  }> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      query.organizationalId = orgId;
    }
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      pagination: PaginationInterface;
      data: UserComplete[];
    }>(`${environment.apiUrl}user/paginated-list`, { params });
  }
  recoveryPasswordByUserId(
    changePasswordPayload: ChangePassword
  ): Observable<ApiResponseInterface<ChangePassword>> {
    return this._httpClient.patch<ApiResponseInterface<ChangePassword>>(
      `${environment.apiUrl}user/recovery-password`,
      changePasswordPayload
    );
  }
  getUserEditPanel(
    userId: string,
    forceRefresh = false
  ): Observable<ApiResponseInterface<UserComplete>> {
    if (forceRefresh || !this._userPanelCache.has(userId)) {
      this._userPanelCache.set(
        userId,
        this._httpClient.get<ApiResponseInterface<UserComplete>>(
          `${environment.apiUrl}user/${userId}`
        ).pipe(shareReplay(1))
      );
    }
    return this._userPanelCache.get(userId)!;
  }
  updateUserProfile(
    userId: string,
    body: Partial<CreateUserPanel>
  ): Observable<ApiResponseInterface<void>> {
    return this._httpClient
      .patch<ApiResponseInterface<void>>(
        `${environment.apiUrl}user/${userId}`,
        body
      )
      .pipe(tap(() => this.invalidateUserPanelCache(userId)));
  }
  createUser(user: CreateUserPanel): Observable<ApiResponseCreateInterface> {
    const orgId = this._authService.getOrganizationalId();
    if (orgId) {
      user.organizationalId = orgId;
    }
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}user`,
      user
    );
  }
  updateUser(
    userId: string,
    body: Partial<CreateUserPanel>
  ): Observable<ApiResponseInterface<void>> {
    return this._httpClient.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}user/${userId}`,
      body
    );
  }
  deleteUserPanel(userId: string): Observable<unknown> {
    return this._httpClient.delete(`${environment.apiUrl}user/${userId}`);
  }

  /**
   * Descarta la respuesta cacheada de `getUserEditPanel` para ese usuario.
   * Hay que llamarlo tras cualquier mutación: el caché usa `shareReplay(1)`, así
   * que sin invalidarlo una recarga posterior devuelve los datos viejos (era la
   * razón de que el avatar recién subido no se viera).
   */
  invalidateUserPanelCache(userId: string): void {
    this._userPanelCache.delete(userId);
  }

  /**
   * Emite el id del usuario cuyos datos (o avatar) acaban de cambiar. El navbar
   * carga al usuario una sola vez al arrancar, así que sin este aviso seguía
   * mostrando la foto anterior hasta recargar la página entera.
   */
  private readonly _userUpdated = new Subject<string>();
  readonly userUpdated$: Observable<string> = this._userUpdated.asObservable();

  notifyUserUpdated(userId: string): void {
    this.invalidateUserPanelCache(userId);
    this._userUpdated.next(userId);
  }

  uploadAvatar(userId: string, file: File): Observable<ApiResponseInterface<void>> {
    const formData = new FormData();
    formData.append('file', file);
    return this._httpClient
      .patch<ApiResponseInterface<void>>(
        `${environment.apiUrl}user/${userId}/avatar`,
        formData
      )
      .pipe(tap(() => this.invalidateUserPanelCache(userId)));
  }

  deleteAvatar(userId: string): Observable<ApiResponseInterface<void>> {
    return this._httpClient
      .delete<ApiResponseInterface<void>>(
        `${environment.apiUrl}user/${userId}/avatar`
      )
      .pipe(tap(() => this.invalidateUserPanelCache(userId)));
  }
}
