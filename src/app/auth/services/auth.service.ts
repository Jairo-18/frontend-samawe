import { LocalStorageService } from './../../shared/services/localStorage.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, map, Observable, of, ReplaySubject, tap } from 'rxjs';
import {
  LoginCredentials,
  LoginSuccessInterface,
  RawLoginResponse
} from '../interfaces/login.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { Router } from '@angular/router';
import { UserInterface } from '../../shared/interfaces/user.interface';
import { LogOutInterface } from '../interfaces/logout.interface';
import { ChangePassword } from '../../organizational/interfaces/create.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _tokensStorageKey: string = '_sessionData';
  private readonly _localStorageService: LocalStorageService =
    inject(LocalStorageService);
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  private _refreshingToken: boolean = false;
  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;
  _isLoggedSubject: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private readonly _router: Router = inject(Router);
  private _currentUserSubject: BehaviorSubject<UserInterface | null> =
    new BehaviorSubject<UserInterface | null>(null);
  public currentUser$: Observable<UserInterface | null> =
    this._currentUserSubject.asObservable();
  sendPasswordResetEmail(email: string): Observable<ChangePassword> {
    const endpoint = `${environment.apiUrl}auth/recovery-password`;
    if (!email || !this.isValidEmail(email)) {
      throw new Error('El correo electrónico proporcionado no es válido.');
    }
    return this._httpClient.post<ChangePassword>(endpoint, { email });
  }
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  login(
    credentials: LoginCredentials
  ): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    const params = this._httpUtilities.httpParamsFromObject(credentials);
    return this._httpClient
      .post<
        ApiResponseInterface<RawLoginResponse>
      >(`${environment.apiUrl}auth/sign-in`, params)
      .pipe(
        map(
          (
            res: ApiResponseInterface<RawLoginResponse>
          ): ApiResponseInterface<LoginSuccessInterface> => {
            const raw = res.data;
            const loginSuccessData: LoginSuccessInterface = {
              tokens: raw.tokens,
              user: {
                userId: raw.user.userId,
                roleType: raw.user.roleType,
                organizationalId: raw.user.organizationalId
              },
              session: {
                accessSessionId: raw.accessSessionId
              }
            };
            return {
              ...res,
              data: loginSuccessData
            };
          }
        ),
        tap((res) => {
          this.saveLocalUserData(res.data);
          this._isLoggedEmit();
          this.scheduleTokenRefresh();
        })
      );
  }
  saveLocalUserData(userData: LoginSuccessInterface): void {
    localStorage.setItem(this._tokensStorageKey, JSON.stringify(userData));
  }
  logout(data: LogOutInterface): Observable<unknown> {
    const params = this._httpUtilities.httpParamsFromObject(data);
    return this._httpClient
      .post<unknown>(`${environment.apiUrl}auth/sign-out`, params)
      .pipe(
        tap(() => {
          this._clearRefreshTimer();
          this._localStorageService.cleanLocalStorage();
          this._isLoggedSubject.next(false);
          this._router.navigateByUrl('/auth/login');
        })
      );
  }
  isAuthenticated(): boolean {
    const userData = this._localStorageService.getAllSessionData();
    return !!userData && !!userData.tokens.accessToken;
  }
  isAuthenticatedToGuard() {
    const token = this.isAuthenticated();
    return of(!!token);
  }
  getAuthToken(): string | undefined {
    return this._localStorageService.getAllSessionData()?.tokens?.accessToken;
  }
  getRefreshToken(): string | undefined {
    return this._localStorageService.getAllSessionData()?.tokens?.refreshToken;
  }
  set setRefreshingToken(status: boolean) {
    this._refreshingToken = status;
  }
  get getRefreshingToken(): boolean {
    return this._refreshingToken;
  }
  get isLogged(): boolean {
    return !!this.getAuthToken();
  }
  refreshToken(
    refreshToken: string
  ): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    this.setRefreshingToken = true;
    return this._httpClient
      .post<
        ApiResponseInterface<LoginSuccessInterface>
      >(`${environment.apiUrl}auth/refresh-token`, { refreshToken: refreshToken })
      .pipe(
        tap((response: ApiResponseInterface<LoginSuccessInterface>): void => {
          if (response.data?.tokens) {
            this._updateSessionTokens(
              response.data.tokens.accessToken,
              response.data.tokens.refreshToken
            );
          }
          this._isLoggedEmit();
        })
      );
  }
  private _isLoggedEmit(): void {
    this._isLoggedSubject.next(this.isLogged);
  }
  private _updateSessionTokens(
    accessToken: string,
    refreshToken: string
  ): void {
    const user: LoginSuccessInterface | null =
      this._localStorageService.getAllSessionData();
    if (user && accessToken && refreshToken) {
      user.tokens.accessToken = accessToken;
      user.tokens.refreshToken = refreshToken;
      localStorage.setItem(this._tokensStorageKey, JSON.stringify(user));
    }
  }

  private _decodeTokenPayload(token: string): { exp?: number } | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  scheduleTokenRefresh(): void {
    this._clearRefreshTimer();

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return;

    const decoded = this._decodeTokenPayload(refreshToken);
    if (!decoded?.exp) return;

    const refreshAtMs = decoded.exp * 1000 - 2 * 60 * 60 * 1000;
    const delayMs = refreshAtMs - Date.now();

    if (delayMs <= 0) {
      this._proactiveRefresh();
      return;
    }

    this._refreshTimer = setTimeout(() => this._proactiveRefresh(), delayMs);
  }

  private _proactiveRefresh(): void {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return;

    const decoded = this._decodeTokenPayload(refreshToken);
    if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
      this.cleanStorageAndRedirectToLogin();
      return;
    }

    this.refreshToken(refreshToken).subscribe({
      next: () => this.scheduleTokenRefresh(),
      error: () => this.cleanStorageAndRedirectToLogin()
    });
  }

  private _clearRefreshTimer(): void {
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  cleanStorageAndRedirectToLogin(): void {
    this._clearRefreshTimer();
    this._localStorageService.cleanLocalStorage();
    this._isLoggedEmit();
    this._router.navigate([`home`]);
  }
  getUserLoggedIn(): UserInterface {
    return this._localStorageService.getUserData();
  }
  setRedirectUrl(url: string): void {
    this._localStorageService.setRedirectUrl(url);
  }
  getRedirectUrl(): string | null {
    return this._localStorageService.getRedirectUrl();
  }
  cleanRedirectUrl(): void {
    this._localStorageService.cleanRedirectUrl();
  }
  getCurrentUserId(): string | null {
    try {
      const userData = this._localStorageService.getAllSessionData();
      return userData?.user?.userId || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }
  getCurrentUser(): UserInterface | null {
    try {
      return this.getUserLoggedIn();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  getOrganizationalId(): string | null {
    try {
      const userData = this._localStorageService.getAllSessionData();
      return userData?.user?.organizationalId || null;
    } catch (error) {
      console.error('Error getting organizational ID:', error);
      return null;
    }
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}auth/google`;
  }
}
