/** Selección de un ítem a acreditar (devolución parcial). */
export interface CreditNoteItemSelection {
  invoiceDetailId: number;
  quantity?: number;
}

/** Cuerpo para generar una nota crédito sobre una factura. */
export interface CreateCreditNotePayload {
  isTotal?: boolean;
  items?: CreditNoteItemSelection[];
  correctionConceptCode?: string;
  observation?: string;
}

/** Resultado de Factus al emitir la nota crédito. */
export interface CreditNoteResult {
  number: string | null;
  referenceCode: string | null;
  isValidated: boolean;
  cude: string | null;
  qrCode: string | null;
  publicUrl: string | null;
  total: string;
  createdAt: string;
}

/** Nota crédito persistida (la que devuelve el listado). */
export interface CreditNote {
  creditNoteId: number;
  invoiceId: number;
  referenceCode: string;
  correctionConceptCode: string;
  isTotal: boolean;
  factusNumber?: string;
  factusCude?: string;
  factusQrCode?: string;
  factusPublicUrl?: string;
  total: string;
  observation?: string;
  /** Selección acreditada: base para calcular el restante por ítem. */
  itemsSnapshot?: { invoiceDetailId: number; quantity: number }[];
  createdAt: string;
}
