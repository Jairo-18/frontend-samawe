import { CreateInvoiceDetaill } from './invoiceDetaill.interface';

export interface PendingInvoiceDetail {
  id: string; // generated uuid or timestamp for local tracking
  type: 'Producto' | 'Hospedaje' | 'Servicio' | 'Compra' | 'Compra Servicio';
  name: string;
  payload: CreateInvoiceDetaill;
}
