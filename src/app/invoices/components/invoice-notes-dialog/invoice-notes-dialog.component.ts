import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import {
  InvoiceNotes,
  InvoiceNotesService
} from '../../services/invoiceNotes.service';
import { InvoiceService } from '../../services/invoice.service';
import { CreditNote } from '../../interface/creditNote.interface';
import { DebitNote } from '../../interface/debitNote.interface';
import { AdjustmentNote } from '../../interface/adjustmentNote.interface';
import { NoteViewDialogComponent } from '../note-view-dialog/note-view-dialog.component';

export interface InvoiceNotesDialogData {
  invoiceId: number;
  invoiceCode: string;
  invoiceTypeCode?: string;
  invoiceTotal: number;
}

/**
 * Todas las notas crédito y débito de una factura electrónica, en un solo
 * lugar, para verlas sin entrar al detalle. Cada una abre su detalle
 * (`NoteViewDialog`), que a su vez enlaza a la versión oficial de Factus.
 */
@Component({
  selector: 'app-invoice-notes-dialog',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormatCopPipe,
    BaseDialogComponent,
    LoaderComponent
  ],
  templateUrl: './invoice-notes-dialog.component.html'
})
export class InvoiceNotesDialogComponent implements OnInit {
  private readonly _dialogRef = inject(MatDialogRef<InvoiceNotesDialogComponent>);
  private readonly _dialog = inject(MatDialog);
  private readonly _notesService = inject(InvoiceNotesService);
  private readonly _invoiceService = inject(InvoiceService);
  /** Nombres de los ítems por `invoiceDetailId`: las notas solo guardan el id. */
  private detailNames: Record<number, string> = {};
  readonly data: InvoiceNotesDialogData = inject(MAT_DIALOG_DATA);

  notes: InvoiceNotes | null = null;
  loading = true;

  ngOnInit(): void {
    this._notesService
      .load(this.data.invoiceId, this.data.invoiceTypeCode, this.data.invoiceTotal)
      .subscribe((notes) => {
        this.notes = notes;
        this.loading = false;
      });

    // Informativo: si falla, el detalle muestra el número de ítem en vez del
    // nombre, que es lo que se veía antes.
    this._invoiceService.getInvoiceToEdit(this.data.invoiceId).subscribe({
      next: (res) => {
        for (const d of res.data?.invoiceDetails ?? []) {
          const raw: any =
            d.product?.name ?? d.accommodation?.name ?? d.excursion?.name;
          const name =
            typeof raw === 'string'
              ? raw
              : (raw?.['es'] ?? (raw ? (Object.values(raw)[0] as string) : ''));
          if (name) this.detailNames[d.invoiceDetailId] = name;
        }
      },
      error: () => undefined
    });
  }

  /** Número de la nota crédito que neutralizó esta nota débito (o null). */
  neutralizedBy(debit: DebitNote): string | null {
    const credit = this.notes?.creditNotes.find((c) =>
      (c.neutralizedDebitNoteIds ?? []).includes(debit.debitNoteId)
    );
    return credit ? credit.factusNumber || credit.referenceCode : null;
  }

  open(
    kind: 'credit' | 'debit' | 'adjustment',
    note: CreditNote | DebitNote | AdjustmentNote
  ): void {
    this._dialog.open(NoteViewDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        kind,
        note,
        invoiceCode: this.data.invoiceCode,
        detailNames: this.detailNames
      }
    });
  }

  close(): void {
    this._dialogRef.close();
  }
}
