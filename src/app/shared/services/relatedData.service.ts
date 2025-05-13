import {
  CreateUserRelatedData,
  RegisterUserRelatedData
} from './../../auth/interfaces/register.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment.development';
import { CreateProductRelatedData } from '../../products/interface/product.interface';

@Injectable({
  providedIn: 'root'
})
export class RelatedDataService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

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

  createProductRelatedData(): Observable<
    ApiResponseInterface<CreateProductRelatedData>
  > {
    return this._httpClient.get<ApiResponseInterface<CreateProductRelatedData>>(
      `${environment.apiUrl}product/create/related-data`
    );
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
