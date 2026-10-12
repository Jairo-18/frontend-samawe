import { ApplicationService } from '../../organizational/services/application.service';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { LocalStorageService } from './../../shared/services/localStorage.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, map, Observable, of, ReplaySubject, tap } from 'rxjs';
import {
  ActingOrganization,
  LoginCredentials,
  LoginSuccessInterface,
  RawLoginResponse,
  SwitchOrganizationResponse
} from '../interfaces/login.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { Router } from '@angular/router';
import { UserInterface } from '../../shared/interfaces/user.interface';
import { LogOutInterface } from '../interfaces/logout.interface';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ChangePassword } from '../../organizational/interfaces/create.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _ngZone: NgZone = inject(NgZone);
  private readonly _tokensStorageKey: string = '_sessionData';
  private readonly _localStorageService: LocalStorageService =
    inject(LocalStorageService);
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _apiConfig: ApiConfigService = inject(ApiConfigService);
  // Por Injector y no inject() directo: ApplicationService se pide recién al salir.
  private readonly _injector: Injector = inject(Injector);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);
  private readonly _sidebarState: SidebarStateService =
    inject(SidebarStateService);
  private _refreshingToken: boolean = false;
  private _signingOut: boolean = false;
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
    // Hotel del login (`?hotel=`): dónde buscar la cuenta.
    const hotel = this._apiConfig.getLoginHotel()?.slug;
    return this._httpClient.post<ChangePassword>(endpoint, { email, ...(hotel && { hotel }) });
  }
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  login(
    credentials: LoginCredentials
  ): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    // Hotel del login (`?hotel=`): el mismo correo puede tener cuenta en
    // varios hoteles; el backend la busca en ese.
    const hotel = this._apiConfig.getLoginHotel()?.slug;
    const params = this._httpUtilities.httpParamsFromObject(
      hotel ? { ...credentials, hotel } : credentials
    );
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
    this._localStorageService.setItem(this._tokensStorageKey, JSON.stringify(userData));
  }
  /**
   * Cierre de sesión, en un único sitio.
   *
   * Estaba copiado en tres componentes —sidebar (`default-layout`), navbar
   * (`nav-bar`) y ajustes del sitio público (`settings`)— y las copias ya
   * habían divergido: solo la del sidebar limpiaba el estado de
   * `SidebarStateService`. Como ese servicio es `providedIn: 'root'`, salir por
   * la navbar o por ajustes dejaba `_sessionOpen` en `true`, y al volver a
   * entrar en la misma pestaña `openForSession()` no abría el sidebar.
   *
   * `_signingOut` cubre además el doble clic: no era dañino (los dos caminos
   * acaban limpiando y redirigiendo) pero mandaba una petición de más contra
   * una sesión ya borrada.
   */
  signOut(): void {
    if (this._signingOut) return;
    // El login de destino se decide AHORA, con la sesión todavía en pie: más
    // abajo se borra, y calcularlo después mandaba siempre al de Samawe.
    const loginUrl = this._loginUrlForSession();

    const session = this._localStorageService.getAllSessionData();
    if (
      !session?.user?.userId ||
      !session?.tokens?.accessToken ||
      !session?.session?.accessSessionId
    ) {
      // Sin datos completos no hay nada que cerrar en el servidor, pero la
      // sesión local sí hay que dejarla limpia.
      this._finishSignOut(loginUrl);
      return;
    }

    this._signingOut = true;
    this.logout({
      userId: session.user.userId,
      accessToken: session.tokens.accessToken,
      accessSessionId: session.session.accessSessionId
    }).subscribe({
      next: () => this._finishSignOut(loginUrl),
      // Si el servidor falla igual hay que sacar a la persona: dejarla dentro
      // con la sesión a medias es peor que perder el registro del cierre.
      error: () => this._finishSignOut(loginUrl)
    });
  }

  private _finishSignOut(loginUrl: string): void {
    this._signingOut = false;
    this._sidebarState.closeForLogout();
    this._sidebarState.clearCache();
    this.cleanStorageAndRedirectToLogin(loginUrl);
  }

  logout(data: LogOutInterface): Observable<unknown> {
    const params = this._httpUtilities.httpParamsFromObject(data);
    return this._httpClient
      .post<unknown>(`${environment.apiUrl}auth/sign-out`, params)
      .pipe(
        tap(() => {
          // Sin navegar: lo hace `signOut()` una sola vez, con el login que
          // calculó antes de borrar la sesión.
          this._clearRefreshTimer();
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
      this._localStorageService.setItem(this._tokensStorageKey, JSON.stringify(user));
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

    this._ngZone.runOutsideAngular(() => {
      this._refreshTimer = setTimeout(() => this._proactiveRefresh(), delayMs);
    });
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

  cleanStorageAndRedirectToLogin(loginUrl: string = this._loginUrlForSession()): void {
    this._clearRefreshTimer();
    this._localStorageService.cleanLocalStorage();
    this._isLoggedEmit();
    this._router.navigateByUrl(loginUrl);
  }

  /**
   * A qué login vuelve quien cierra sesión (o a quien se le vence), leído ANTES
   * de limpiarla: el de su hotel. Samawe -> su login de siempre; otro hotel ->
   * `/auth/login?hotel=<slug>`, sin nada de Samawe. Sale del hotel con que
   * entró; si la sesión no lo tiene (abierta antes de este cambio), del hotel
   * cuya marca tiene el panel, si es el del usuario.
   */
  private _loginUrlForSession(): string {
    let hotel = this._apiConfig.getSessionHotel();
    if (!hotel) {
      const org = this._injector.get(ApplicationService).currentOrg;
      // El hotel de la CUENTA, no en el que actúa: un superadmin dentro de otro
      // hotel sigue siendo de Samawe y vuelve a su login.
      if (org?.slug && org.organizationalId === this.getHomeOrganizationalId()) hotel = org.slug;
    }
    return hotel && hotel !== 'ecohotelsamawe'
      ? `/auth/login?hotel=${encodeURIComponent(hotel)}`
      : '/auth/login';
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
  /**
   * Super administrador: pasa el panel a otra organización (o de vuelta a la
   * propia). Guarda los tokens nuevos y recarga la aplicación entera: los
   * servicios cachean datos de la organización anterior (catálogos, marca,
   * listados) y una recarga es la única forma segura de no mezclarlos.
   */
  switchOrganization(organizationalId: string): Observable<void> {
    return this._httpClient
      .post<ApiResponseInterface<SwitchOrganizationResponse>>(
        `${environment.apiUrl}auth/switch-organization`,
        { organizationalId }
      )
      .pipe(
        map((res) => {
          const data = res.data;
          const session: LoginSuccessInterface | null =
            this._localStorageService.getAllSessionData();
          if (!data?.tokens || !session) {
            throw new Error('No se pudo cambiar de organización.');
          }
          const home =
            session.user.homeOrganizationalId ??
            data.homeOrganizationalId ??
            session.user.organizationalId;
          session.tokens = data.tokens;
          session.user.organizationalId = data.organization.organizationalId;
          session.user.homeOrganizationalId = home;
          session.user.actingOrganization = data.isActingOrganization
            ? data.organization
            : null;
          this._localStorageService.setItem(
            this._tokensStorageKey,
            JSON.stringify(session)
          );
        })
      );
  }

  /** Organización elegida con el selector, si el super admin está en otra. */
  getActingOrganization(): ActingOrganization | null {
    try {
      return (
        this._localStorageService.getAllSessionData()?.user
          ?.actingOrganization ?? null
      );
    } catch {
      return null;
    }
  }

  getHomeOrganizationalId(): string | null {
    try {
      const user = this._localStorageService.getAllSessionData()?.user;
      return user?.homeOrganizationalId ?? user?.organizationalId ?? null;
    } catch {
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
    if (isPlatformBrowser(this._platformId)) {
      window.location.href = `${environment.apiUrl}auth/google`;
    }
  }
}
