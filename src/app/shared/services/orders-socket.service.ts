import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
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

  constructor() {
    const baseUrl = environment.apiUrl.endsWith('/')
      ? environment.apiUrl.slice(0, -1)
      : environment.apiUrl;

    this.socket = io(`${baseUrl}/orders`);

    this.socket.on('connect', () => {
      this.socket.emit('joinOrders');
    });

    this.socket.on('orderUpdated', (data: OrderUpdate) => {
      this.addNotification(data);
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
    return new Observable<OrderUpdate>((observer) => {
      this.socket.on('orderUpdated', (data: OrderUpdate) => {
        observer.next(data);
      });
    });
  }

  onInvoiceItemAdded(): Observable<InvoiceItemUpdate> {
    return new Observable<InvoiceItemUpdate>((observer) => {
      this.socket.on('invoiceItemAdded', (data: InvoiceItemUpdate) => {
        observer.next(data);
      });
    });
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
