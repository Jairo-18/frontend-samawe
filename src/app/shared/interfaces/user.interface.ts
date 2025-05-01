export interface UserInterface {
  id: string;
  identificationTypeId: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role?: RoleType;
  createdAt: Date;
  updatedAt: Date;
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
