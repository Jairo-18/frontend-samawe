import { UserComplete } from '../../organizational/interfaces/create.interface';
import { AccommodationComplete } from '../../service-and-product/interface/accommodation.interface';
import { ExcursionComplete } from '../../service-and-product/interface/excursion.interface';
import { ProductComplete } from '../../service-and-product/interface/product.interface';
import {
  CategoryType,
  IdentificationType,
  InvoiceType,
  PaidType,
  PayType,
  TaxeType
} from './../../shared/interfaces/relatedDataGeneral';

export interface InvoiceDetail {
  invoiceDetailId: number;
  amount: string;
  priceWithoutTax: string;
  priceWithTax: string;
  subtotal: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  product: ProductComplete;
  accommodation: AccommodationComplete;
  excursion: ExcursionComplete;
  taxeType: TaxeType;
}

export interface createInvoiceRelatedData {
  categoryType: CategoryType[];
  identificationType: IdentificationType[];
  invoiceType: InvoiceType[];
  taxeType: TaxeType[];
  payType: PayType[];
  paidType: PaidType[];
}

export interface Invoice {
  invoiceId: number;
  code: string;
  subtotalWithoutTax: string;
  subtotalWithTax: string;
  total: string;
  startDate: string;
  endDate: string;
  user: UserComplete;
  employee: UserComplete;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  invoiceType: InvoiceType;
  payType: PayType;
  paidType: PaidType;
  invoiceDetails: InvoiceDetail[];
}

export interface CreateInvoice {
  invoiceTypeId: number;
  userId: string;
  payTypeId: number;
  paidTypeId: number;
  invoiceElectronic: boolean;
  startDate: string;
  endDate: string;
}

export interface EditInvoice {
  invoiceId: number;
  payTypeId: number;
  paidTypeId: number;
  invoiceElectronic: boolean;
}

export interface InvoiceComplete {
  invoiceId: number;
  code: string;
  subtotalWithoutTax: string;
  subtotalWithTax: string;
  total: string;
  startDate: string;
  endDate: string;
  user: UserComplete;
  employee: UserComplete;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  invoiceType: InvoiceType;
  payType: PayType;
  paidType: PaidType;
  invoiceDetails: InvoiceDetail[];
  invoiceElectronic: boolean;
}

export interface DialogData {
  editMode: boolean;
  invoiceId?: number;
  relatedData: {
    invoiceType: InvoiceType[];
    paidType: PaidType[];
    payType: PayType[];
  };
}

// En invoice.interface.ts
export interface InvoiceBasicInfo {
  invoiceId: number;
  payTypeId: number;
  paidTypeId: number;
  invoiceElectronic: boolean;
  invoiceTypeId?: number;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface EditInvoice extends InvoiceBasicInfo {
  invoiceId: number; // Hacemos obligatorio para edición
}

export interface Invoicee extends InvoiceBasicInfo {
  // ... otras propiedades específicas de Invoice
  code: string;
  subtotalWithoutTax: string;
  // ... etc.
}
