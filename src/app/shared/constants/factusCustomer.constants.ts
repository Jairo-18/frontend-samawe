/**
 * Espejo de `backend-samawe/src/shared/constants/factusCustomer.constants.ts`.
 * Los valores son códigos de la DIAN que viajan tal cual a Factus, así que si
 * cambia uno hay que cambiarlo en los dos sitios.
 *
 * Son DOS EJES INDEPENDIENTES: el tipo de persona (jurídica/natural) y la
 * responsabilidad de IVA. Una persona natural puede ser responsable de IVA y
 * una jurídica puede no serlo.
 */

export const FACTUS_LEGAL_ORGANIZATION_JURIDICA = '1';
export const FACTUS_LEGAL_ORGANIZATION_NATURAL = '2';

export const FACTUS_TRIBUTE_IVA = '01';
export const FACTUS_TRIBUTE_NO_APLICA = 'ZZ';

export interface FactusCodeOption {
  value: string;
  labelKey: string;
}

/** Opciones del selector "Tipo de persona". */
export const LEGAL_ORGANIZATION_OPTIONS: FactusCodeOption[] = [
  {
    value: FACTUS_LEGAL_ORGANIZATION_NATURAL,
    labelKey: 'organizational.edit_user.person_natural'
  },
  {
    value: FACTUS_LEGAL_ORGANIZATION_JURIDICA,
    labelKey: 'organizational.edit_user.person_juridica'
  }
];

/**
 * Opciones del selector "Responsable de IVA". El catálogo DIAN tiene más
 * códigos (04 INC, ZA IVA e INC), pero el hotel solo necesita distinguir
 * responsable de no responsable; añadirlos es agregar entradas aquí y en la
 * lista `FACTUS_TRIBUTE_CODES` del backend.
 */
export const TRIBUTE_OPTIONS: FactusCodeOption[] = [
  {
    value: FACTUS_TRIBUTE_NO_APLICA,
    labelKey: 'organizational.edit_user.tribute_not_responsible'
  },
  {
    value: FACTUS_TRIBUTE_IVA,
    labelKey: 'organizational.edit_user.tribute_responsible'
  }
];

/** Tipo de persona sugerido por el documento. Solo es el valor inicial. */
export function suggestedLegalOrganizationCode(isNit: boolean): string {
  return isNit
    ? FACTUS_LEGAL_ORGANIZATION_JURIDICA
    : FACTUS_LEGAL_ORGANIZATION_NATURAL;
}
