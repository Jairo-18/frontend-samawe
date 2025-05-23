export interface CreateType {
  code: string;
  name: string;
}

export interface CategoryType {
  categoryTypeId: number;
  code?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface StateType {
  stateTypeId: number;
  code?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface BedType {
  bedTypeId: number;
  code?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface RoleType {
  roleTypeId: string;
  code?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PhoneCode {
  phoneCodeId: string;
  code?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IdentificationType {
  identificationTypeId: string;
  code?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
