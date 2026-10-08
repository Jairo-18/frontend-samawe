import { InvoiceDetail } from '../../invoices/interface/invoiceDetaill.interface';

export interface OrderUpdate {
  notificationId?: string;
  invoiceId: number;
  code: string;
  state: string;
  stateCode: string;
  tableNumber?: string;
  updatedAt: Date | string;
  orderTime?: Date | string;
  readyTime?: Date | string;
  servedTime?: Date | string;
  message?: string;
}

/** Solicitud de reserva que un huésped acaba de hacer (llega solo al personal). */
export interface ReservationRequest {
  notificationId: string;
  title: string;
  message: string;
  createdAt: Date | string;
  stateCode: string;
  invoiceId: number;
  code: string;
  guestName: string;
  accommodationName: string;
  startDate: string;
  endDate: string;
  nights: number;
  guests: number;
  total: number;
  expiresAt: string;
}

/** Aviso privado al huésped sobre el estado de su reserva. */
export interface GuestNotification {
  notificationId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: Date | string;
  metadata: {
    kind: 'RESERVATION_STATUS';
    status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'CANCELLED';
    invoiceId: number;
    code: string;
    accommodationName: string;
    startDate: string;
    endDate: string;
  };
}

export interface InvoiceItemUpdate {
  invoiceId: number;
  details: InvoiceDetail;
}
