import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderNotification } from '../interfaces/order-notification.interface';
import { PaginationInterface } from '../interfaces/pagination.interface';
import { HttpUtilitiesService } from '../utilities/http-utilities.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);
  private readonly _authService: AuthService = inject(AuthService);
  private _initialCache$: Observable<{
    data: {
      notifications: Record<
        string,
        { data: OrderNotification[]; pagination: PaginationInterface }
      >;
      unreadCount: number;
    };
  }> | null = null;

  constructor() {
    this._authService._isLoggedSubject.subscribe((isLogged) => {
      if (!isLogged) this._initialCache$ = null;
    });
  }

  getNotifications(query: object): Observable<{
    data: OrderNotification[];
    pagination: PaginationInterface;
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._http.get<{
      data: OrderNotification[];
      pagination: PaginationInterface;
    }>(`${environment.apiUrl}notifications`, { params });
  }

  getInitialNotifications(): Observable<{
    data: {
      notifications: Record<
        string,
        { data: OrderNotification[]; pagination: PaginationInterface }
      >;
      unreadCount: number;
    };
  }> {
    if (!this._initialCache$) {
      this._initialCache$ = this._http
        .get<{
          data: {
            notifications: Record<
              string,
              { data: OrderNotification[]; pagination: PaginationInterface }
            >;
            unreadCount: number;
          };
        }>(`${environment.apiUrl}notifications/initial`)
        .pipe(shareReplay(1));
    }
    return this._initialCache$;
  }

  clearInitialCache(): void {
    this._initialCache$ = null;
  }

  getUnreadCount(): Observable<{ data: { count: number } }> {
    return this._http.get<{ data: { count: number } }>(
      `${environment.apiUrl}notifications/unread-count`
    );
  }

  toggleRead(id: string): Observable<{ data: OrderNotification }> {
    return this._http.patch<{ data: OrderNotification }>(
      `${environment.apiUrl}notifications/${id}/toggle-read`,
      {}
    );
  }

  markAllAsRead(): Observable<{ data: { affected: number } }> {
    return this._http.patch<{ data: { affected: number } }>(
      `${environment.apiUrl}notifications/mark-all-read`,
      {}
    );
  }

  markAllAsUnread(): Observable<{ data: { affected: number } }> {
    return this._http.patch<{ data: { affected: number } }>(
      `${environment.apiUrl}notifications/mark-all-unread`,
      {}
    );
  }

  deleteNotification(id: string): Observable<{ data: { deleted: boolean } }> {
    return this._http.delete<{ data: { deleted: boolean } }>(
      `${environment.apiUrl}notifications/${id}`
    );
  }

  deleteAll(): Observable<{ data: { affected: number } }> {
    return this._http.delete<{ data: { affected: number } }>(
      `${environment.apiUrl}notifications/all`
    );
  }
}
