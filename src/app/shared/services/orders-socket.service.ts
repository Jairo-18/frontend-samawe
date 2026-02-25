import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderUpdate } from '../interfaces/order-socket.interface';

@Injectable({
  providedIn: 'root'
})
export class OrdersSocketService {
  private socket: Socket;

  constructor() {
    const baseUrl = environment.apiUrl.endsWith('/')
      ? environment.apiUrl.slice(0, -1)
      : environment.apiUrl;

    this.socket = io(`${baseUrl}/orders`, {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to orders websocket');
      this.socket.emit('joinOrders');
    });
  }

  /**
   * Escucha el evento de actualización de pedidos.
   */
  onOrderUpdated(): Observable<OrderUpdate> {
    return new Observable<OrderUpdate>((observer) => {
      this.socket.on('orderUpdated', (data: OrderUpdate) => {
        observer.next(data);
      });
    });
  }

  /**
   * Desconecta el socket.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
