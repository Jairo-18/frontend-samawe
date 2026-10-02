import { TranslatedField } from '../../shared/types/translated-field.type';

/** Resumen de una factura propia, tal como lo devuelve `GET invoices/mine`. */
export interface MyInvoice {
  invoiceId: number;
  code: string;
  createdAt?: string;
  total: number;
  invoiceType?: { code: string; name: TranslatedField };
  stateType?: { code: string; name: TranslatedField };
  stays: { name: TranslatedField; startDate?: string; endDate?: string }[];
  orders: { name: TranslatedField; amount: number }[];
  excursions: { name: TranslatedField }[];
}

/** Detalle de una factura propia (`GET invoices/mine/:id`). Sin costos internos. */
export interface MyInvoiceDetail {
  invoiceId: number;
  code: string;
  createdAt?: string;
  tableNumber?: string;
  orderTime?: string;
  readyTime?: string;
  servedTime?: string;
  subtotalWithoutTax: number;
  taxes: number;
  total: number;
  paidTotal: number;
  invoiceType?: { code: string; name: TranslatedField };
  payType?: { code: string; name: TranslatedField };
  paidType?: { code: string; name: TranslatedField };
  stateType?: { code: string; name: TranslatedField };
  lines: {
    kind: 'stay' | 'product' | 'excursion';
    name: TranslatedField;
    amount: number;
    unitPrice: number;
    subtotal: number;
    startDate?: string;
    endDate?: string;
  }[];
}
