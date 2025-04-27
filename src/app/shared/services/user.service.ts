import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment.development';
import { IdentificationType } from '../../auth/interfaces/register.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  registerRelatedData(): Observable<
    ApiResponseInterface<{ identificationType: IdentificationType[] }>
  > {
    return this._httpClient.get<
      ApiResponseInterface<{ identificationType: IdentificationType[] }>
    >(`${environment.apiUrl}user/register/related-data`);
  }

  // getUserProfile(
  //   userId: string
  // ): Observable<ApiResponseInterface<user>> {
  //   return this._httpClient.get<ApiResponseInterface<UserInterface>>(
  //     `${environment.apiUrl}user/${userId}`
  //   );
  // }

  // updateUserProfile(userId: string, body: unknown): Observable<void> {
  //   return this._httpClient.patch<void>(
  //     `${environment.apiUrl}user/${userId}`,
  //     body
  //   );
  // }

  // updateUserPassword(
  //   changePasswordPayload: ChangePassword
  // ): Observable<ApiResponseInterface<ChangePassword>> {
  //   return this._httpClient.post<ApiResponseInterface<ChangePassword>>(
  //     `${environment.apiUrl}user/change-password`,
  //     changePasswordPayload
  //   );
  // }

  // recoveryPasswordByUserId(
  //   changePasswordPayload: ChangePassword
  // ): Observable<ApiResponseInterface<ChangePassword>> {
  //   return this._httpClient.patch<ApiResponseInterface<ChangePassword>>(
  //     `${environment.apiUrl}user/recovery-password`,
  //     changePasswordPayload
  //   );
  // }
}
