import { IdentificationType, PersonType, PhoneCode } from './relatedDataGeneral';

export interface MediaType {
  mediaTypeId: number;
  code: string;
  name: string;
}

export interface OrganizationalMedia {
  organizationalMediaId: string;
  url: string;
  publicId?: string;
  label?: string;
  priority: number;
  isActive: boolean;
  mediaType: MediaType;
}

export interface Organizational {
  organizationalId: string;
  name: string;
  legalName?: string;
  slug: string;
  identificationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  department?: string;
  timezone?: string;
  languageDefault?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  metaTitle?: string;
  metaDescription?: string;
  paymentEnabled: boolean;
  status: boolean;
  identificationType?: IdentificationType;
  personType?: PersonType;
  phoneCode?: PhoneCode;
  medias: OrganizationalMedia[];
}
