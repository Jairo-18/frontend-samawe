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
}

export interface InvoiceItemUpdate {
  invoiceId: number;
  details: InvoiceDetail;
}
