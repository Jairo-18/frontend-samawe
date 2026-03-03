import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderNotification } from '../interfaces/order-notification.interface';
import { PaginationInterface } from '../interfaces/pagination.interface';
import { HttpUtilitiesService } from '../utilities/http-utilities.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private http = inject(HttpClient);
  private _httpUtilities = inject(HttpUtilitiesService);
  private apiUrl = `${environment.apiUrl}notifications`;

  getNotifications(query: object): Observable<{
    data: OrderNotification[];
    pagination: PaginationInterface;
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this.http.get<{
      data: OrderNotification[];
      pagination: PaginationInterface;
    }>(this.apiUrl, { params });
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
    return this.http.get<{
      data: {
        notifications: Record<
          string,
          { data: OrderNotification[]; pagination: PaginationInterface }
        >;
        unreadCount: number;
      };
    }>(`${this.apiUrl}/initial`);
  }

  getUnreadCount(): Observable<{ data: { count: number } }> {
    return this.http.get<{ data: { count: number } }>(
      `${this.apiUrl}/unread-count`
    );
  }

  toggleRead(id: string): Observable<{ data: OrderNotification }> {
    return this.http.patch<{ data: OrderNotification }>(
      `${this.apiUrl}/${id}/toggle-read`,
      {}
    );
  }

  markAllAsRead(): Observable<{ data: { affected: number } }> {
    return this.http.patch<{ data: { affected: number } }>(
      `${this.apiUrl}/mark-all-read`,
      {}
    );
  }

  markAllAsUnread(): Observable<{ data: { affected: number } }> {
    return this.http.patch<{ data: { affected: number } }>(
      `${this.apiUrl}/mark-all-unread`,
      {}
    );
  }

  deleteNotification(id: string): Observable<{ data: { deleted: boolean } }> {
    return this.http.delete<{ data: { deleted: boolean } }>(
      `${this.apiUrl}/${id}`
    );
  }

  deleteAll(): Observable<{ data: { affected: number } }> {
    return this.http.delete<{ data: { affected: number } }>(
      `${this.apiUrl}/all`
    );
  }
}
