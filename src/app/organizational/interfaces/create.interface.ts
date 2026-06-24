import {
  IdentificationType,
  PhoneCode,
  RoleType,
  PersonType
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
  isActive?: boolean;
  roleType?: string;
  personType?: string;
  organizationalId?: string;
  // Dirección y ubicación DANE (solo Colombia; null/omitido para extranjeros).
  address?: string;
  departmentId?: number | null;
  municipalityId?: number | null;
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
  personType?: PersonType;
  isActive: boolean;
  avatarUrl?: string;
  organizationalId?: string;
  address?: string;
  department?: { departmentId: number; code: string; name: string } | null;
  municipality?: {
    municipalityId: number;
    code: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
export interface ChangePassword {
  oldPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
  userId?: string;
  resetToken?: string;
}
