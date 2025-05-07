export interface RegisterUser {
  userId: string;
  identificationType: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  roleType?: string;
}

export interface CreateUserData {
  identificationType: IdentificationType[];
  roleType: RoleType[];
  phoneCode: PhoneCode[];
}

export interface RegisterUserData {
  identificationType: IdentificationType[];
  phoneCode: PhoneCode[];
}

export interface IdentificationType {
  identificationTypeId: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface RoleType {
  roleTypeId: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PhoneCode {
  phoneCodeId: string;
  code?: string;
  name: string;
}
