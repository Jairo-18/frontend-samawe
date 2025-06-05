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

export interface CreateInvoice {
  invoiceTypeId: number;
  code: string;
  userId: string;
  startDate: string;
  endDate: string;
  payTypeId: number;
  paidTypeId: number;
  details: InvoiceDetail[];
}

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
