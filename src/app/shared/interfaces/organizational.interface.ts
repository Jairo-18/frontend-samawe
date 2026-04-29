import {
  IdentificationType,
  PersonType,
  PhoneCode
} from './relatedDataGeneral';
import { TranslatedField } from '../types/translated-field.type';

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

export interface CorporateValue {
  corporateValueId: string;
  title: TranslatedField;
  description?: TranslatedField;
  order: number;
  imageUrl?: string;
}

export interface BenefitItem {
  benefitItemId: string;
  name: TranslatedField;
  icon: string;
  order: number;
}

export interface BenefitSection {
  benefitSectionId: string;
  title: TranslatedField;
  order: number;
  items: BenefitItem[];
}

export type LegalType = 'terms' | 'privacy';

export interface LegalItemChild {
  legalItemChildId: string;
  content: TranslatedField;
  order: number;
}

export interface LegalItem {
  legalItemId: string;
  title?: TranslatedField;
  description?: TranslatedField;
  order: number;
  children: LegalItemChild[];
}

export interface LegalSection {
  legalSectionId: string;
  type: LegalType;
  items: LegalItem[];
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
  description?: TranslatedField;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  bgPrimaryColor?: string;
  bgSecondaryColor?: string;
  homeTitle?: TranslatedField;
  homeDescription?: TranslatedField;
  experienceTitle?: TranslatedField;
  experienceDescription?: TranslatedField;
  reservationTitle?: TranslatedField;
  reservationDescription?: TranslatedField;
  aboutUsTitle?: TranslatedField;
  aboutUsDescription?: TranslatedField;
  missionTitle?: TranslatedField;
  missionDescription?: TranslatedField;
  visionTitle?: TranslatedField;
  visionDescription?: TranslatedField;
  historyTitle?: TranslatedField;
  historyDescription?: TranslatedField;
  gastronomyTitle?: TranslatedField;
  gastronomyDescription?: TranslatedField;
  gastronomyHistoryTitle?: TranslatedField;
  gastronomyHistoryDescription?: TranslatedField;
  gastronomyKitchenTitle?: TranslatedField;
  gastronomyKitchenDescription?: TranslatedField;
  gastronomyIngredientsTitle?: TranslatedField;
  gastronomyIngredientsDescription?: TranslatedField;
  accommodationsTitle?: TranslatedField;
  accommodationsDescription?: TranslatedField;
  howToArriveDescription?: TranslatedField;
  howToArrivePublicTransportDescription?: TranslatedField;
  howToArrivePrivateTransportDescription?: TranslatedField;
  accessibilityDescription?: TranslatedField;
  mapsUrl?: string;
  videoUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  metaTitle?: TranslatedField;
  metaDescription?: TranslatedField;
  paymentEnabled: boolean;
  status: boolean;
  identificationType?: IdentificationType;
  personType?: PersonType;
  phoneCode?: PhoneCode;
  medias: OrganizationalMedia[];
  corporateValues?: CorporateValue[];
  benefitSections?: BenefitSection[];
  legalSections?: LegalSection[];
}
