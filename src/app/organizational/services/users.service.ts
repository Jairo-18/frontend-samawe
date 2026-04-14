import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    userId: string
  ): Observable<ApiResponseInterface<UserComplete>> {
    return this._httpClient.get<ApiResponseInterface<UserComplete>>(
      `${environment.apiUrl}user/${userId}`
    );
  }
  updateUserProfile(
    userId: string,
    body: Partial<CreateUserPanel>
  ): Observable<ApiResponseInterface<void>> {
    return this._httpClient.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}user/${userId}`,
      body
    );
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

  uploadAvatar(userId: string, file: File): Observable<ApiResponseInterface<void>> {
    const formData = new FormData();
    formData.append('file', file);
    return this._httpClient.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}user/${userId}/avatar`,
      formData
    );
  }

  deleteAvatar(userId: string): Observable<ApiResponseInterface<void>> {
    return this._httpClient.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}user/${userId}/avatar`
    );
  }
}
