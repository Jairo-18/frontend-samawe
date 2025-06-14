import { AccommodationComplete } from '../../service-and-product/interface/accommodation.interface';
import { ExcursionComplete } from '../../service-and-product/interface/excursion.interface';
import { ProductComplete } from '../../service-and-product/interface/product.interface';
import { TaxeType } from '../../shared/interfaces/relatedDataGeneral';

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
  product?: ProductComplete;
  accommodation?: AccommodationComplete;
  excursion?: ExcursionComplete;
  taxeType: TaxeType;
}

export interface CreateInvoiceDetaill {
  productId?: number;
  accommodationId?: number;
  excursionId?: number;
  amount: number;
  priceBuy: number;
  priceWithoutTax: number;
  taxeTypeId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AddedProductInvoiceDetaill {
  productId?: number;
  code: string;
  name: string;
  description?: string;
  amount: number;
  priceBuy: number;
  priceSale: number;
  categoryTypeId: number;
  taxeTypeId?: number;
}

export interface AddedAccommodationInvoiceDetaill {
  accommodationId?: number;
  code: string;
  name: string;
  description?: string;
  amountPerson: number;
  jacuzzi: boolean;
  amountRoom: number;
  amountBathroom: number;
  priceBuy: number;
  priceSale: number;
  categoryTypeId: number;
  bedTypeId: number;
  stateTypeId?: number;
  taxeTypeId?: number;
}

export interface AddedExcursionInvoiceDetaill {
  excursionId?: number;
  code: string;
  name: string;
  description?: string;
  priceBuy: number;
  priceSale: number;
  stateTypeId: number;
  categoryTypeId: number;
  taxeTypeId?: number;
}
