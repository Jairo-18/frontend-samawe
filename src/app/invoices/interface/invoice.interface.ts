import { UserComplete } from '../../organizational/interfaces/create.interface';
import {
  AdditionalType,
  CategoryType,
  DiscountType,
  IdentificationType,
  InvoiceType,
  PaidType,
  PayType,
  TaxeType,
  StateType
} from './../../shared/interfaces/relatedDataGeneral';
import { InvoiceDetail } from './invoiceDetaill.interface';
export interface createInvoiceRelatedData {
  categoryType: CategoryType[];
  identificationType: IdentificationType[];
  invoiceType: InvoiceType[];
  taxeType: TaxeType[];
  payType: PayType[];
  paidType: PaidType[];
  additionalType: AdditionalType[];
  discountType: DiscountType[];
}
export interface Invoice {
  invoiceId: number;
  code: string;
  observations?: string;
  subtotalWithoutTax?: string;
  subtotalWithTax?: string;
  total?: string;
  paidTotal?: number;
  totalTaxes?: number;
  totalVat?: number;
  totalIco8?: number;
  totalIco5?: number;
  startDate: string;
  endDate: string;
  user: UserComplete;
  employee: UserComplete;
  cash?: number;
  transfer?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  invoiceType: InvoiceType;
  payType?: PayType;
  paidType?: PaidType;
  invoiceDetails: InvoiceDetail[];
  invoiceElectronic?: boolean;
  tableNumber?: string;
  orderTime?: string;
  readyTime?: string;
  servedTime?: string;
  stateType?: StateType;
  organizationalId?: string;
}
export interface CreateInvoice {
  invoiceTypeId: number;
  userId: string;
  payTypeId: number;
  paidTypeId: number;
  invoiceElectronic: boolean;
  cash?: number;
  transfer?: number;
  startDate?: string;
  endDate?: string;
  organizationalId?: string;
}
export interface EditInvoice {
  invoiceId: number;
  payTypeId?: number;
  paidTypeId?: number;
  invoiceElectronic?: boolean;
  cash?: number;
  transfer?: number;
  startDate?: string;
}
export interface InvoiceComplete {
  invoiceId: number;
  code: string;
  observations?: string;
  subtotalWithoutTax: string;
  subtotalWithTax: string;
  total: string;
  paidTotal?: number;
  startDate: string;
  totalTaxes?: number;
  totalVat?: number;
  totalIco8?: number;
  totalIco5?: number;
  endDate: string;
  user: UserComplete;
  employee: UserComplete;
  cash?: number;
  transfer?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  invoiceType: InvoiceType;
  payType: PayType;
  paidType: PaidType;
  invoiceDetails: InvoiceDetail[];
  invoiceElectronic: boolean;
  tableNumber?: string;
  orderTime?: string;
  readyTime?: string;
  servedTime?: string;
  stateType?: StateType;
  organizationalId?: string;
}
export interface DialogData {
  editMode: boolean;
  invoiceId?: number;
  relatedData: {
    invoiceType?: InvoiceType[];
    paidType: PaidType[];
    payType: PayType[];
    stateType?: StateType[];
  };
}
