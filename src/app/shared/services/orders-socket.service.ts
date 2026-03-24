import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InvoiceItemUpdate,
  OrderUpdate
} from '../interfaces/order-socket.interface';

@Injectable({
  providedIn: 'root'
})
export class OrdersSocketService {
  private socket: Socket;

  private _notifications = new BehaviorSubject<OrderUpdate[]>([]);
  public notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this._unreadCount.asObservable();

  private _orderUpdated$ = new Subject<OrderUpdate>();
  private _invoiceItemAdded$ = new Subject<InvoiceItemUpdate>();

  constructor() {
    const baseUrl = environment.apiUrl.endsWith('/')
      ? environment.apiUrl.slice(0, -1)
      : environment.apiUrl;

    this.socket = io(`${baseUrl}/orders`, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.socket.emit('joinOrders');
    });

    this.socket.on('reconnect', () => {
      this.socket.emit('joinOrders');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    this.socket.on('orderUpdated', (data: OrderUpdate) => {
      this._orderUpdated$.next(data);
    });

    this.socket.on('invoiceItemAdded', (data: InvoiceItemUpdate) => {
      this._invoiceItemAdded$.next(data);
    });
  }

  private addNotification(notification: OrderUpdate) {
    const current = this._notifications.getValue();
    const updated = [notification, ...current].slice(0, 20);
    this._notifications.next(updated);
    this._unreadCount.next(this._unreadCount.getValue() + 1);
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
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
