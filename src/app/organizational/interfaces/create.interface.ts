import {
  IdentificationType,
  PhoneCode,
  RoleType
} from '../../shared/interfaces/relatedDataGeneral';

export interface CreateUserPanel {
  userId?: string;
  identificationType: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  roleType?: string;
}

export interface UserComplete {
  userId: string;
  identificationType: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: PhoneCode;
  phone: string;
  password: string;
  confirmPassword: string;
  roleType?: RoleType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
