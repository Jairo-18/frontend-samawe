import { CategoryType } from '../../shared/interfaces/relatedDataServiceAndProduct.interface';

export interface CreateProductPanel {
  productId?: number;
  code: number;
  name: string;
  description?: string;
  amount: number;
  priceBuy: number;
  priceSale: number;
  categoryTypeId: number;
}

export interface ProductComplete {
  productId: number;
  code: number;
  name: string;
  description?: string;
  amount: number;
  priceBuy: number;
  priceSale: number;
  categoryType: CategoryType;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
}

export interface CreateProductRelatedData {
  categoryType: CategoryType[];
}
