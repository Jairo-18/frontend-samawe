import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { CreditNote } from '../../interface/creditNote.interface';
import { DebitNote } from '../../interface/debitNote.interface';
import { AdjustmentNote } from '../../interface/adjustmentNote.interface';

export interface NoteViewData {
  kind: 'credit' | 'debit' | 'adjustment';
  note: CreditNote | DebitNote | AdjustmentNote;
  /** Código de la factura a la que pertenece (para el encabezado). */
  invoiceCode?: string;
  /** Nombres de los ítems de la factura por `invoiceDetailId` (solo nota crédito). */
  detailNames?: Record<number, string>;
}

interface ViewItem {
  label: string;
  quantity: number;
  total?: number;
}

/**
 * Detalle de una nota crédito o débito tal como la guarda samawe, con acceso a
 * la versión oficial en Factus (`factusPublicUrl`). La nota crédito solo
 * guarda una SELECCIÓN de ítems de la factura (id + cantidad); la débito, en
 * cambio, guarda los conceptos completos porque son texto libre.
 */
@Component({
  selector: 'app-note-view-dialog',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormatCopPipe,
    BaseDialogComponent
  ],
  templateUrl: './note-view-dialog.component.html'
})
export class NoteViewDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<NoteViewDialogComponent>);
  readonly data: NoteViewData = inject(MAT_DIALOG_DATA);

  /** Crédito y ajuste restan; ambas guardan una selección de ítems. */
  get isCredit(): boolean {
    return this.data.kind !== 'debit';
  }

  get credit(): CreditNote {
    return this.data.note as CreditNote;
  }

  get titleKey(): string {
    return {
      credit: 'invoice.edit.note_credit',
      debit: 'invoice.edit.note_debit',
      adjustment: 'invoice.edit.note_adjustment'
    }[this.data.kind];
  }

  get number(): string {
    return (
      this.data.note.factusNumber || this.data.note.referenceCode || '—'
    );
  }

  /** Clave i18n del concepto DIAN; si no la conocemos, se muestra el código. */
  get conceptKey(): string {
    // Cada tipo de nota tiene sus propios conceptos DIAN: el "2" de la nota de
    // ajuste es la anulación del DOCUMENTO SOPORTE, no de una factura.
    return `invoice.notes_view.concept_${this.data.kind}_${this.data.note.correctionConceptCode}`;
  }

  get items(): ViewItem[] {
    if (this.isCredit) {
      return ((this.credit as any).itemsSnapshot ?? []).map((i: any) => ({
        label:
          this.data.detailNames?.[i.invoiceDetailId] ??
          `#${i.invoiceDetailId}`,
        quantity: Number(i.quantity ?? 0)
      }));
    }
    const debit = this.data.note as DebitNote;
    return (debit.itemsSnapshot ?? []).map((i) => {
      const qty = Number(i.quantity ?? 0);
      const price = Number(i.price ?? 0);
      const rate = Number(i.taxes?.[0]?.rate ?? 0);
      const net = Math.round(qty * price * 100) / 100;
      return {
        label: i.name,
        quantity: qty,
        total: net + Math.round(((net * rate) / 100) * 100) / 100
      };
    });
  }

  /** CUDE (crédito/débito) o CUDS (nota de ajuste del documento soporte). */
  get cude(): string | undefined {
    const note: any = this.data.note;
    return note.factusCude ?? note.factusCuds;
  }

  close(): void {
    this._dialogRef.close();
  }
}
