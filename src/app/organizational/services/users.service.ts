import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface
} from '../../shared/interfaces/api-response.interface';
import { CreateUserPanel } from '../interfaces/create.interface';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  getUserProfile(
    userId: string
  ): Observable<ApiResponseInterface<CreateUserPanel>> {
    return this._httpClient.get<ApiResponseInterface<CreateUserPanel>>(
      `${environment.apiUrl}user/${userId}`
    );
  }

  updateUserProfile(userId: string, body: unknown): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}user/${userId}`,
      body
    );
  }

  createUser(user: CreateUserPanel): Observable<ApiResponseCreateInterface> {
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.apiUrl}user/register`,
      user
    );
  }

  deleteUser(userId: string): Observable<unknown> {
    return this._httpClient.delete(`${environment.apiUrl}user/${userId}`);
  }

  updateUser(userId: string, body: unknown): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}user/${userId}`,
      body
    );
  }
}
