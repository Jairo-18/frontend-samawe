/** Selección de un ítem a ajustar del documento soporte. */
export interface AdjustmentNoteItemSelection {
  invoiceDetailId: number;
  quantity?: number;
}

/** Cuerpo para generar una nota de ajuste sobre un documento soporte. */
export interface CreateAdjustmentNotePayload {
  /**
   * '1' devolución parcial · '2' anulación · '3' rebaja o descuento ·
   * '4' ajuste de precio · '5' otros.
   */
  correctionConceptCode?: string;
  isTotal?: boolean;
  items?: AdjustmentNoteItemSelection[];
  observation?: string;
}

/** Resultado de Factus al emitir la nota de ajuste. */
export interface AdjustmentNoteResult {
  number: string | null;
  referenceCode: string | null;
  isValidated: boolean;
  /** CUDS, igual que el documento soporte del que cuelga. */
  cuds: string | null;
  qrCode: string | null;
  publicUrl: string | null;
  total: string;
  createdAt: string;
}

/** Nota de ajuste persistida (la que devuelve el listado). */
export interface AdjustmentNote {
  adjustmentNoteId: number;
  invoiceId: number;
  referenceCode: string;
  correctionConceptCode: string;
  isTotal: boolean;
  supportDocumentNumber: string;
  factusNumber?: string;
  factusCuds?: string;
  factusQrCode?: string;
  factusPublicUrl?: string;
  total: string;
  observation?: string;
  /** Selección ajustada: base para calcular el restante por ítem. */
  itemsSnapshot?: { invoiceDetailId: number; quantity: number }[];
  createdAt: string;
}
