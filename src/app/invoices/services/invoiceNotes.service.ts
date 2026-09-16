import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InvoiceService } from './invoice.service';
import { CreditNote } from '../interface/creditNote.interface';
import { DebitNote } from '../interface/debitNote.interface';
import { AdjustmentNote } from '../interface/adjustmentNote.interface';

/**
 * Las notas asociadas a un documento, ya agregadas.
 *
 * `net` es lo que el documento vale HOY: el total original menos lo acreditado
 * o ajustado, más lo cobrado por notas débito. Es la misma cuenta que el badge
 * del listado (`see-invoices.noteBadge`), que es la referencia visible.
 */
export interface InvoiceNotes {
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  adjustmentNotes: AdjustmentNote[];
  /** Restado por notas crédito y de ajuste. */
  deducted: number;
  /** Sumado por notas débito. */
  added: number;
  net: number;
  /** El documento quedó sin valor: lo acreditado cubre su total. */
  annulled: boolean;
  /** ¿Hay alguna nota? Evita pintar secciones vacías. */
  any: boolean;
}

const EMPTY: InvoiceNotes = {
  creditNotes: [],
  debitNotes: [],
  adjustmentNotes: [],
  deducted: 0,
  added: 0,
  net: 0,
  annulled: false,
  any: false
};

/**
 * Carga las notas de un documento electrónico para mostrarlas y para
 * imprimirlas.
 *
 * Existe para que la vista de detalle y los DOS generadores de PDF no vuelvan a
 * calcular el neto cada uno por su cuenta: es justo el tipo de duplicación que
 * dejó el balance sin netear durante meses (§14 y §16).
 */
@Injectable({ providedIn: 'root' })
export class InvoiceNotesService {
  private readonly _invoiceService = inject(InvoiceService);

  /**
   * Solo pide lo que aplica al tipo de documento: una factura no tiene notas de
   * ajuste y un documento soporte no tiene crédito ni débito. Pedirlas igual
   * daría 400 y ensuciaría la consola.
   *
   * Best-effort por rama: esto es informativo y **no debe impedir ver ni
   * imprimir** el documento. Si un endpoint falla, se muestra el resto.
   */
  load(
    invoiceId: number,
    invoiceTypeCode?: string,
    invoiceTotal = 0
  ): Observable<InvoiceNotes> {
    if (!invoiceId) return of(EMPTY);

    const isSupport = invoiceTypeCode === 'DSE';
    const isSale = invoiceTypeCode === 'FV' || invoiceTypeCode === 'FVE';
    if (!isSupport && !isSale) return of(EMPTY);

    const none = of({ data: [] as any[] });

    return forkJoin({
      credit: isSale
        ? this._invoiceService.getCreditNotes(invoiceId).pipe(
            catchError(() => none)
          )
        : none,
      debit: isSale
        ? this._invoiceService.getDebitNotes(invoiceId).pipe(
            catchError(() => none)
          )
        : none,
      adjustment: isSupport
        ? this._invoiceService.getAdjustmentNotes(invoiceId).pipe(
            catchError(() => none)
          )
        : none
    }).pipe(
      map(({ credit, debit, adjustment }) =>
        this.aggregate(
          (credit.data ?? []) as CreditNote[],
          (debit.data ?? []) as DebitNote[],
          (adjustment.data ?? []) as AdjustmentNote[],
          invoiceTotal
        )
      )
    );
  }

  /** Igual que `load`, pero partiendo de notas ya cargadas. */
  aggregate(
    creditNotes: CreditNote[],
    debitNotes: DebitNote[],
    adjustmentNotes: AdjustmentNote[],
    invoiceTotal = 0
  ): InvoiceNotes {
    const sum = (notes: { total: string | number }[]): number =>
      notes.reduce((acc, n) => acc + Number(n.total ?? 0), 0);

    const deducted = sum(creditNotes) + sum(adjustmentNotes);
    const added = sum(debitNotes);
    const total = Number(invoiceTotal ?? 0);

    return {
      creditNotes,
      debitNotes,
      adjustmentNotes,
      deducted,
      added,
      net: total - deducted + added,
      // Margen de un peso: los totales de la DIAN vienen redondeados y varias
      // notas parciales pueden quedar unos céntimos por debajo del total sin
      // que quede nada vivo. Mismo criterio que `see-invoices.noteBadge`.
      annulled: total > 0 && deducted > 0 && deducted >= total - 1,
      any:
        creditNotes.length > 0 ||
        debitNotes.length > 0 ||
        adjustmentNotes.length > 0
    };
  }
}
