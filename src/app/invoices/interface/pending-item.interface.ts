import { CreateInvoiceDetaill } from './invoiceDetaill.interface';
export interface PendingInvoiceDetail {
  id: string;
  type: 'Producto' | 'Hospedaje' | 'Servicio' | 'Compra' | 'Compra Servicio';
  name: string;
  payload: CreateInvoiceDetaill;
}

