import {
  CategoryType,
  StateType
} from '../../shared/interfaces/relatedDataServiceAndProduct.interface';

export interface CreateExcursionPanel {
  excursionId?: number;
  code: string;
  name: string;
  description?: string;
  amountPerson: number;
  priceBuy: number;
  priceSale: number;
  stateTypeId: number;
  categoryTypeId: number;
}

export interface ExcursionComplete {
  excursionId: number;
  code: string;
  name: string;
  description?: string;
  amountPerson: number;
  priceBuy: number;
  priceSale: number;
  stateType: StateType;
  categoryType: CategoryType;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
}

export interface CreateExcursionRelatedData {
  categoryType: CategoryType[];
  stateType: StateType[];
}
