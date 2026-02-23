import {
  CategoryType,
  UnitOfMeasure
} from '../../shared/interfaces/relatedDataGeneral';
import { ImageItem } from '../../shared/interfaces/image.interface';

export interface CreateProductPanel {
  productId?: number;
  code: string;
  name: string;
  description?: string;
  amount: number;
  priceBuy: number;
  priceSale: number;
  isActive: boolean;
  taxe?: number;
  categoryTypeId: number;
  unitOfMeasureId?: number;
}

export interface ProductComplete {
  productId: number;
  code: string;
  name: string;
  description?: string;
  amount: number;
  taxe?: number;
  priceBuy: number;
  priceSale: number;
  isActive: boolean;
  categoryType: CategoryType;
  unitOfMeasure?: UnitOfMeasure;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
  images?: ImageItem[];
}

export interface ProductListResponse {
  products: ProductComplete[];
}
