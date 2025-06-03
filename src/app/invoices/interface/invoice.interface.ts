import {
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
  productId?: number;
  accommodationId?: number;
  excursionId?: number;
  amount: number;
  priceWithoutTax: number;
  taxeTypeId: number;
}

export interface createInvoiceRelatedData {
  identificationType: IdentificationType[];
  invoiceType: InvoiceType[];
  taxeType: TaxeType[];
  payType: PayType[];
  paidType: PaidType[];
}
