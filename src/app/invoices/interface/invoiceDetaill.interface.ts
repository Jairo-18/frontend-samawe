export interface CreateInvoiceDetaill {
  productId?: number;
  accommodationId?: number;
  excursionId?: number;
  amount: number;
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
