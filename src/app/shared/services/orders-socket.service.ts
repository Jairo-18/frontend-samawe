import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InvoiceItemUpdate,
  OrderUpdate
} from '../interfaces/order-socket.interface';
import { LocalStorageService } from './localStorage.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersSocketService {
  private socket: Socket | null = null;
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _ngZone: NgZone = inject(NgZone);
  private readonly _localStorageService: LocalStorageService = inject(LocalStorageService);
  private readonly _authService: AuthService = inject(AuthService);

  private _notifications = new BehaviorSubject<OrderUpdate[]>([]);
  public notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this._unreadCount.asObservable();

  private _orderUpdated$ = new Subject<OrderUpdate>();
  private _invoiceItemAdded$ = new Subject<InvoiceItemUpdate>();

  constructor() {
    if (!isPlatformBrowser(this._platformId)) return;

    if (this._authService.isAuthenticated()) {
      this._connect();
    }

    this._authService._isLoggedSubject.subscribe((isLogged) => {
      if (isLogged) {
        this._connect();
      } else {
        this._disconnect();
      }
    });
  }

  private _connect(): void {
    if (this.socket?.connected) return;

    this._ngZone.runOutsideAngular(() => {
      const baseUrl = environment.apiUrl.endsWith('/')
        ? environment.apiUrl.slice(0, -1)
        : environment.apiUrl;

      this.socket = io(`${baseUrl}/orders`, {
        auth: (cb: (data: object) => void) => cb({ token: this._localStorageService.getAccessToken() }),
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.socket!.emit('joinOrders');
      });

      this.socket.on('reconnect', () => {
        this.socket!.emit('joinOrders');
      });

      this.socket.on('orderUpdated', (data: OrderUpdate) => {
        this._ngZone.run(() => this._orderUpdated$.next(data));
      });

      this.socket.on('invoiceItemAdded', (data: InvoiceItemUpdate) => {
        this._ngZone.run(() => this._invoiceItemAdded$.next(data));
      });
    });
  }

  private _disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public markAsRead() {
    this._unreadCount.next(0);
  }

  onOrderUpdated(): Observable<OrderUpdate> {
    return this._orderUpdated$.asObservable();
  }

  onInvoiceItemAdded(): Observable<InvoiceItemUpdate> {
    return this._invoiceItemAdded$.asObservable();
  }

  joinUserRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('joinUserRoom', { userId });
    }
  }

  disconnect() {
    this._disconnect();
  }
}
