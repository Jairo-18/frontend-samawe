import {
  IdentificationType,
  PersonType,
  PhoneCode
} from './relatedDataGeneral';

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
  title: string;
  description?: string;
  order: number;
  imageUrl?: string;
}

export interface BenefitItem {
  benefitItemId: string;
  name: string;
  icon: string;
  order: number;
}

export interface BenefitSection {
  benefitSectionId: string;
  title: string;
  order: number;
  items: BenefitItem[];
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
  tertiaryColor?: string;
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  bgPrimaryColor?: string;
  bgSecondaryColor?: string;
  homeTitle?: string;
  homeDescription?: string;
  experienceTitle?: string;
  experienceDescription?: string;
  reservationTitle?: string;
  reservationDescription?: string;
  aboutUsTitle?: string;
  aboutUsDescription?: string;
  missionTitle?: string;
  missionDescription?: string;
  visionTitle?: string;
  visionDescription?: string;
  historyTitle?: string;
  historyDescription?: string;
  gastronomyTitle?: string;
  gastronomyDescription?: string;
  gastronomyHistoryTitle?: string;
  gastronomyHistoryDescription?: string;
  gastronomyKitchenTitle?: string;
  gastronomyKitchenDescription?: string;
  gastronomyIngredientsTitle?: string;
  gastronomyIngredientsDescription?: string;
  accommodationsTitle?: string;
  accommodationsDescription?: string;
  howToArrivePublicTransportDescription?: string;
  howToArrivePrivateTransportDescription?: string;
  accessibilityDescription?: string;
  mapsUrl?: string;
  videoUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  paymentEnabled: boolean;
  status: boolean;
  identificationType?: IdentificationType;
  personType?: PersonType;
  phoneCode?: PhoneCode;
  medias: OrganizationalMedia[];
  corporateValues?: CorporateValue[];
  benefitSections?: BenefitSection[];
}
