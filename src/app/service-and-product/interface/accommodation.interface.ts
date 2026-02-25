import {
  BedType,
  CategoryType,
  StateType
} from '../../shared/interfaces/relatedDataGeneral';
import { ImageItem } from '../../shared/interfaces/image.interface';
export interface CreateAccommodationPanel {
  accommodationId?: number;
  code: string;
  name: string;
  description?: string;
  amountPerson: number;
  jacuzzi: boolean;
  amountRoom: number;
  amountBathroom: number;
  priceBuy: number;
  taxe?: number;
  priceSale: number;
  categoryTypeId: number;
  bedTypeId: number;
  stateTypeId?: number;
}
export interface AccommodationComplete {
  accommodationId: number;
  code: string;
  name: string;
  description?: string;
  amountPerson: number;
  jacuzzi: boolean;
  amountRoom: number;
  amountBathroom: number;
  priceBuy: number;
  priceSale: number;
  taxe?: number;
  categoryType: CategoryType;
  bedType: BedType;
  stateType?: StateType;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;
  images?: ImageItem[];
}
export interface GetAccommodationPaginatedList {
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
  images?: ImageItem[];
}
export interface CreateAccommodationRelatedData {
  categoryType: CategoryType[];
  bedType: BedType[];
  stateType: StateType[];
}

