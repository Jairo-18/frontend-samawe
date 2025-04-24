import { ApiResponseInterface } from './../interfaces/api-response.interface';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';
import { inject, Injector, runInInjectionContext } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { NotificationsService } from '../services/notifications.service';
import { LoginResponse } from '../../auth/interfaces/login.interface';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService: AuthService = inject(AuthService);
  const injector: Injector = inject(Injector);
  const notificationsService: NotificationsService =
    inject(NotificationsService);
  const tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  const authRequest: HttpRequest<unknown> = addTokenToRequest(req);
  return next(authRequest).pipe(
    catchError((err: HttpErrorResponse) => {
      const refreshToken: string = authService.getRefreshToken();
      switch (err.status) {
        case 401:
          if (refreshToken && !authService.getRefreshingToken) {
            tokenSubject.next('');

            return authService.refreshToken(refreshToken).pipe(
              switchMap((response: ApiResponseInterface<LoginResponse>) => {
                const updateReq = runInInjectionContext(injector, () =>
                  addTokenToRequest(
                    authRequest,
                    response.data?.tokens?.accessToken
                  )
                );
                tokenSubject.next(response.data?.tokens?.accessToken);
                return next(updateReq);
              }),
              catchError((refreshError) => {
                return throwError(refreshError);
              })
            );
          }
          if (
            refreshToken &&
            authService.getRefreshingToken &&
            !req.url.includes('refresh-token')
          ) {
            return tokenSubject.pipe(
              filter((token: string): boolean => token !== ''),
              take(1),
              switchMap((token: string) => {
                const updateReq = runInInjectionContext(injector, () =>
                  addTokenToRequest(authRequest, token)
                );
                return next(updateReq);
              })
            );
          }
          authService.cleanStorageAndRedirectToLogin();

          return throwError(err);
        case 403:
          notificationsService.showNotification(
            'error',
            err?.error?.message || 'Algo anda mal',
            'No estás autorizado'
          );
          return throwError(err);

        default:
          return throwError(err);
      }
    })
  );
};
export const addTokenToRequest = (
  req: HttpRequest<unknown>,
  refreshToken?: string
): HttpRequest<unknown> => {
  const authService: AuthService = inject(AuthService);
  const authToken: string = refreshToken ?? (authService.getAuthToken() || '');

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};
