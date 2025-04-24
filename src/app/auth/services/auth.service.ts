import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Login, LoginResponse } from '../interfaces/login.interface';
import { environment } from '../../../environments/environment.development';
import { BehaviorSubject, firstValueFrom, Observable, of, tap } from 'rxjs';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private _refreshingToken: boolean = false;
  private readonly _router: Router = inject(Router);
  _isLoggedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private currentUser: unknown = null;

  login(data: Login): Observable<ApiResponseInterface<LoginResponse>> {
    return this._httpClient
      .post<ApiResponseInterface<LoginResponse>>(
        `${environment.apiUrl}auth/sign-in`,
        data
      )
      .pipe(
        tap((response) => {
          localStorage.setItem('session', JSON.stringify(response?.data));
          this._isLoggedEmit();
          this.getLoggedUserData().subscribe({
            next: () => {
              this._router.navigate([`/`]);
            }
          });
        })
      );
  }

  getAuthToken(): string {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session).tokens.accessToken : '';
  }

  set setRefreshingToken(value: boolean) {
    this._refreshingToken = value;
  }

  get getRefreshingToken(): boolean {
    return this._refreshingToken;
  }

  getLoggedUserData(): Observable<ApiResponseInterface<User>> {
    return this._httpClient
      .get<ApiResponseInterface<User>>(`${environment.apiUrl}user/init-data`)
      .pipe(
        tap((response): void => {
          this._isLoggedEmit();
        })
      );
  }

  get currentLoggedUserData() {
    return firstValueFrom(this.getLoggedUserData());
  }

  refreshToken(
    refreshToken: string
  ): Observable<ApiResponseInterface<LoginResponse>> {
    this.setRefreshingToken = true;
    return this._httpClient
      .post<ApiResponseInterface<LoginResponse>>(
        `${environment.apiUrl}auth/refresh-token`,
        {
          refreshToken
        }
      )
      .pipe(
        tap((response) => {
          localStorage.setItem('session', JSON.stringify(response?.data));
          this.setRefreshingToken = false;
          this._isLoggedEmit();
        })
      );
  }

  getRefreshToken(): string {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session).tokens.refreshToken : '';
  }

  getAllUserData(): LoginResponse {
    const session = localStorage.getItem('session');
    if (!session) {
      throw new Error('No session found');
    }

    return JSON.parse(session);
  }

  logout(): void {
    this._isLoggedSubject.next(false);
    localStorage.removeItem('session');
    this.currentUser = null;
  }

  cleanStorageAndRedirectToLogin(): void {
    this.logout();
    this._isLoggedEmit();
    this._router.navigate([`auth/login`]);
  }

  private _isLoggedEmit(): void {
    this._isLoggedSubject.next(this.isLogged);
  }

  get isLogged(): boolean {
    return !!this.getAuthToken();
  }

  isAuthenticated(): boolean {
    const userData = this.getAllUserData();
    return !!userData && !!userData.tokens.accessToken;
  }

  isAuthenticatedToGuard() {
    const token = this.isAuthenticated();
    return of(!!token);
  }
}
