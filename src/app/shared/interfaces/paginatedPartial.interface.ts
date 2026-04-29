import { TranslatedField } from '../types/translated-field.type';

export interface PaginatedUserPartial {
  userId: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}
export interface GeneralPartial {
  name: TranslatedField;
}
