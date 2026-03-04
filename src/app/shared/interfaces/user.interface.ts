export interface UserInterface {
  userId: string;
  identificationTypeId: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: PhoneCode;
  phone: string;
  password: string;
  confirmPassword: string;
  roleType?: RoleType;
  personType?: PersonType;
  createdAt: Date;
  updatedAt: Date;
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
export interface PersonType {
  personTypeId: number;
  code?: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
