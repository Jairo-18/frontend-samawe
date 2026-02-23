import {
  CategoryType,
  StateType
} from '../../shared/interfaces/relatedDataGeneral';
import { ImageItem } from '../../shared/interfaces/image.interface';

export interface CreateExcursionPanel {
  excursionId?: number;
  code: string;
  name: string;
  description?: string;
  priceBuy: number;
  taxe?: number;
  priceSale: number;
  stateTypeId: number;
  categoryTypeId: number;
}

export interface ExcursionComplete {
  excursionId: number;
  code: string;
  name: string;
  description?: string;
  priceBuy: number;
  priceSale: number;
  taxe?: number;
  stateType: StateType;
  categoryType: CategoryType;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
  images?: ImageItem[];
}

export interface ExcursionListResponse {
  excursions: ExcursionComplete[];
}
