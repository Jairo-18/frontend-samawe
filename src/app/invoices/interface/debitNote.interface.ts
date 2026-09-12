/**
 * Una línea de cobro de la nota débito.
 *
 * A diferencia de la nota crédito, **no se eligen ítems de la factura**: una
 * nota débito cobra conceptos que no estaban facturados (intereses, gastos de
 * cobranza, un ajuste de valor), así que se escriben a mano.
 */
export interface DebitNoteItemInput {
  name: string;
  quantity?: number;
  price: number;
  /** Porcentaje ("19" = 19%). 0 = sin impuesto. */
  taxRate?: number;
  /** '01' IVA, '04' IPOCONSUMO. */
  taxCode?: string;
}

/** Cuerpo para generar una nota débito sobre una factura electrónica. */
export interface CreateDebitNotePayload {
  /** '1' intereses · '2' gastos por cobrar · '3' cambio del valor · '4' otros. */
  correctionConceptCode?: string;
  items: DebitNoteItemInput[];
  observation?: string;
}

/** Resultado de Factus al emitir la nota débito. */
export interface DebitNoteResult {
  number: string | null;
  referenceCode: string | null;
  isValidated: boolean;
  cude: string | null;
  qrCode: string | null;
  publicUrl: string | null;
  total: string;
  createdAt: string;
}

/** Nota débito persistida (la que devuelve el listado). */
export interface DebitNote {
  debitNoteId: number;
  invoiceId: number;
  referenceCode: string;
  correctionConceptCode: string;
  factusNumber?: string;
  factusCude?: string;
  factusQrCode?: string;
  factusPublicUrl?: string;
  total: string;
  observation?: string;
  itemsSnapshot?: unknown;
  createdAt: string;
}
