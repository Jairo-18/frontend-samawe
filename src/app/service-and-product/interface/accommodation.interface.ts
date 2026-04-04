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
  organizationalId?: string;
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
  organizationalId?: string;
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
  organizationalId?: string;
  images?: ImageItem[];
}
export interface MostRequestedAccommodation {
  accommodationId: number;
  code: string;
  name: string;
  description?: string;
  amountPerson: number;
  amountRoom: number;
  amountBathroom: number;
  jacuzzi: boolean;
  priceSale: number;
  categoryType: { categoryTypeId: number; code: string; name: string } | null;
  bedType: { bedTypeId: number; code: string; name: string } | null;
  stateType: { stateTypeId: number; code: string; name: string } | null;
  images: { accommodationImageId: number; imageUrl: string; publicId: string }[];
  organizationalId: string | null;
}

export interface CreateAccommodationRelatedData {
  categoryType: CategoryType[];
  bedType: BedType[];
  stateType: StateType[];
}

