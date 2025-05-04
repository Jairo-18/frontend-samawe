export interface RegisterUser {
  userId: string;
  identificationType: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  roleType?: string;
}

export interface CreateRegisterData {
  identificationType: IdentificationType[];
  roleType: RoleType[];
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
