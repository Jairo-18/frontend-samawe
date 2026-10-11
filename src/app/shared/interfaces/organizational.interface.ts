import {
  IdentificationType,
  PersonType,
  PhoneCode
} from './relatedDataGeneral';
import { TranslatedField } from '../types/translated-field.type';

export interface MediaType {
  mediaTypeId: number;
  code: string;
  name: TranslatedField;
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
  /** Propietario / representante legal: User (persona natural) vinculado. */
  legalRepresentativeUserId?: string | null;
  legalRepresentative?: {
    userId: string;
    firstName?: string;
    lastName?: string;
    identificationNumber?: string;
    email?: string;
    identificationType?: { code?: string; name?: TranslatedField } | null;
  } | null;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  department?: string;
  timezone?: string;
  languageDefault?: string;
  description?: TranslatedField;
  /** Familia para títulos. Se resuelve contra `TITLE_FONTS`, no se usa tal cual. */
  fontTitle?: string;
  /** Familia para el texto. Se resuelve contra `BODY_FONTS`. */
  fontBody?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  /** Modo oscuro: solo superficie y texto. Los de marca no se duplican. */
  darkTitleColor?: string;
  darkSubtitleColor?: string;
  darkTextColor?: string;
  darkBgPrimaryColor?: string;
  darkBgSecondaryColor?: string;
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

/** Host que atiende a una organización (tabla `organization_domains`). */
export interface OrganizationDomainInfo {
  hostname: string;
  kind: 'web' | 'api' | 'staging';
  status: 'pending' | 'active' | 'disabled';
  isPrimary: boolean;
}

/** Cuánto uso tiene una organización (para el listado de plataforma). */
export interface OrganizationStats {
  users: number;
  invoices: number;
  products: number;
  accommodations: number;
  excursions: number;
}

/** Una organización tal como la devuelve `GET /organizational` (plataforma). */
export interface PlatformOrganization extends Organizational {
  domains: OrganizationDomainInfo[];
  stats: OrganizationStats;
}

/** Lo que manda el formulario de organizaciones al crear o editar. */
export interface SaveOrganization {
  name: string;
  legalName?: string;
  slug: string;
  identificationType?: string;
  identificationNumber?: string;
  email?: string;
  phoneCode?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  website?: string;
  status: boolean;
}
