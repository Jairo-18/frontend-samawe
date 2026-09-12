import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceDetail } from '../../interface/invoiceDetaill.interface';
import { TranslatedField } from '../../../shared/types/translated-field.type';
import {
  AdjustmentNote,
  AdjustmentNoteResult,
  CreateAdjustmentNotePayload
} from '../../interface/adjustmentNote.interface';

interface ItemRow {
  detail: InvoiceDetail;
  maxQty: number;
  selected: boolean;
  quantity: number;
}

export interface AdjustmentNoteDialogData {
  invoiceId: number;
  invoiceCode: string;
  /** Número del documento soporte que se va a ajustar (p. ej. DSE43). */
  factusNumber?: string;
}

/**
 * Nota de ajuste a documento soporte: es a las COMPRAS lo que la nota crédito
 * es a las ventas. Mismo formulario (total o por ítems) porque el documento que
 * corrige también tiene líneas.
 *
 * ⚠️ Al emitirla el backend **descuenta** stock, porque la compra lo había
 * sumado. Es la dirección contraria a la nota crédito.
 */
@Component({
  selector: 'app-adjustment-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseDialogComponent,
    LoaderComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    FormatCopPipe,
    TranslatedPipe
  ],
  templateUrl: './adjustment-note-dialog.component.html',
  styleUrls: ['./adjustment-note-dialog.component.scss']
})
export class AdjustmentNoteDialogComponent implements OnInit {
  private readonly _dialogRef = inject(
    MatDialogRef<AdjustmentNoteDialogComponent>
  );
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _notifications = inject(NotificationsService);

  /** Motivos DIAN de la nota de ajuste. El '2' es la anulación total. */
  readonly concepts = [
    { code: '1', labelKey: 'invoice.adjustment_note.concept_1' },
    { code: '3', labelKey: 'invoice.adjustment_note.concept_3' },
    { code: '4', labelKey: 'invoice.adjustment_note.concept_4' },
    { code: '5', labelKey: 'invoice.adjustment_note.concept_5' }
  ];

  loading = true;
  submitting = false;
  isTotal = false;
  /** Motivo cuando NO es anulación total (la total fuerza el '2'). */
  conceptCode = '1';
  observation = '';
  rows: ItemRow[] = [];
  existing: AdjustmentNote[] = [];
  result: AdjustmentNoteResult | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: AdjustmentNoteDialogData) {}

  ngOnInit(): void {
    forkJoin({
      invoice: this._invoiceService.getInvoiceToEdit(this.data.invoiceId),
      notes: this._invoiceService.getAdjustmentNotes(this.data.invoiceId)
    }).subscribe({
      next: ({ invoice, notes }) => {
        this.existing = notes.data ?? [];

        // Lo ya ajustado por ítem en notas previas: el restante es el máximo
        // ajustable ahora, igual que en la nota crédito.
        const adjusted = new Map<number, number>();
        for (const note of this.existing) {
          for (const it of note.itemsSnapshot ?? []) {
            adjusted.set(
              it.invoiceDetailId,
              (adjusted.get(it.invoiceDetailId) ?? 0) + Number(it.quantity ?? 0)
            );
          }
        }

        const details = (invoice.data?.invoiceDetails ?? []).filter(
          (d) => !d.deletedAt
        );
        this.rows = details.map((detail) => {
          const original = Number(detail.amount ?? 1);
          const already = adjusted.get(detail.invoiceDetailId) ?? 0;
          const maxQty = Math.max(0, original - already);
          return { detail, maxQty, selected: false, quantity: maxQty };
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this._notifications.showNotification(
          'error',
          'invoice.adjustment_note.load_error',
          'invoice.adjustment_note.title'
        );
      }
    });
  }

  itemName(detail: InvoiceDetail): TranslatedField | null {
    return detail.product?.name ?? null;
  }

  get canSubmit(): boolean {
    if (this.submitting || this.result || this.loading) return false;
    if (this.isTotal) return true;
    return this.rows.some((r) => r.selected && r.quantity > 0);
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.submitting = true;

    const payload: CreateAdjustmentNotePayload = {
      observation: this.observation?.trim() || undefined
    };
    if (this.isTotal) {
      payload.isTotal = true;
      // El motivo '2' ES la anulación del documento soporte: no se deja elegir
      // otro, porque un ajuste "total" con motivo de rebaja sería incoherente.
      payload.correctionConceptCode = '2';
    } else {
      payload.correctionConceptCode = this.conceptCode;
      payload.items = this.rows
        .filter((r) => r.selected && r.quantity > 0)
        .map((r) => ({
          invoiceDetailId: r.detail.invoiceDetailId,
          quantity: r.quantity
        }));
    }

    this._invoiceService
      .createAdjustmentNote(this.data.invoiceId, payload)
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.result = res.data;
          this._notifications.showNotification(
            'success',
            'invoice.adjustment_note.success_msg',
            'invoice.adjustment_note.title'
          );
        },
        error: (err) => {
          this.submitting = false;
          const apiErrors = err?.error?.errors;
          const msg =
            Array.isArray(apiErrors) && apiErrors.length
              ? apiErrors.join(' · ')
              : (err?.error?.message ?? 'invoice.adjustment_note.error_msg');
          this._notifications.showNotification(
            'error',
            msg,
            'invoice.adjustment_note.title'
          );
        }
      });
  }

  close(): void {
    this._dialogRef.close(!!this.result);
  }
}
