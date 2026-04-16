import {
  CategoryType,
  StateType,
  TaxeType
} from '../../shared/interfaces/relatedDataGeneral';
import { ImageItem } from '../../shared/interfaces/image.interface';
export interface CreateExcursionPanel {
  excursionId?: number;
  code: string;
  name: string;
  description?: string;
  priceBuy: number;
  taxe?: number;
  taxeTypeId?: number;
  priceSale: number;
  stateTypeId: number;
  categoryTypeId: number;
  organizationalId?: string;
}
export interface ExcursionComplete {
  excursionId: number;
  code: string;
  name: string;
  description?: string;
  priceBuy: number;
  priceSale: number;
  taxe?: number;
  taxeTypeId?: number;
  taxeType?: TaxeType;
  stateType: StateType;
  categoryType: CategoryType;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
  organizationalId?: string;
  images?: ImageItem[];
}
export interface ExcursionListResponse {
  excursions: ExcursionComplete[];
}

