import {
  BedType,
  CategoryType,
  StateType
} from '../../shared/interfaces/relatedDataServiceAndProduct.interface';

export interface CreateAccommodationPanel {
  accommodationId?: number;
  code: number;
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
}

export interface AccommodationComplete {
  accommodationId: number;
  code: number;
  name: string;
  description?: string;
  amountPerson: number;
  jacuzzi: boolean;
  amountRoom: number;
  amountBathroom: number;
  priceBuy: number;
  priceSale: number;
  categoryType: CategoryType;
  bedType: BedType;
  stateType?: StateType;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
}

export interface CreateAccommodationRelatedData {
  categoryType: CategoryType[];
  bedType: BedType[];
  stateType: StateType[];
}
