import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { InvoiceService } from '../../services/invoice.service';
import {
  CreateDebitNotePayload,
  DebitNote,
  DebitNoteResult
} from '../../interface/debitNote.interface';

/** Una línea editable del formulario. */
interface ChargeRow {
  name: string;
  quantity: number;
  price: number | null;
  taxRate: number;
}

export interface DebitNoteDialogData {
  invoiceId: number;
  invoiceCode: string;
  factusNumber?: string;
}

/**
 * Nota débito: **suma** valor a una factura electrónica ya emitida.
 *
 * A diferencia del diálogo de nota crédito, aquí no se eligen ítems de la
 * factura. Una nota débito cobra conceptos que no estaban facturados —intereses
 * de mora, gastos de cobranza, un ajuste de valor—, así que las líneas se
 * escriben a mano.
 */
@Component({
  selector: 'app-debit-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseDialogComponent,
    LoaderComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    FormatCopPipe
  ],
  templateUrl: './debit-note-dialog.component.html',
  styleUrls: ['./debit-note-dialog.component.scss']
})
export class DebitNoteDialogComponent implements OnInit {
  private readonly _dialogRef = inject(MatDialogRef<DebitNoteDialogComponent>);
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _notifications = inject(NotificationsService);

  /**
   * Conceptos DIAN de la nota débito. **No hay anulación**: para anular una
   * factura la figura es la nota crédito.
   */
  readonly concepts = [
    { code: '1', labelKey: 'invoice.debit_note.concept_1' },
    { code: '2', labelKey: 'invoice.debit_note.concept_2' },
    { code: '3', labelKey: 'invoice.debit_note.concept_3' },
    { code: '4', labelKey: 'invoice.debit_note.concept_4' }
  ];

  /** Impuestos admitidos, con el mismo criterio que el resto de facturación. */
  readonly taxes = [
    { rate: 0, labelKey: 'invoice.debit_note.tax_none' },
    { rate: 19, labelKey: 'invoice.debit_note.tax_iva_19' },
    { rate: 8, labelKey: 'invoice.debit_note.tax_ipo_8' },
    { rate: 5, labelKey: 'invoice.debit_note.tax_ipo_5' }
  ];

  loading = true;
  submitting = false;
  conceptCode = '1';
  observation = '';
  rows: ChargeRow[] = [];
  existing: DebitNote[] = [];
  result: DebitNoteResult | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DebitNoteDialogData) {}

  ngOnInit(): void {
    this.addRow();
    this._invoiceService.getDebitNotes(this.data.invoiceId).subscribe({
      next: (res) => {
        this.existing = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        // No es bloqueante: el listado previo es informativo, se puede emitir
        // igual. Solo se avisa y se sigue.
        this.loading = false;
        this._notifications.showNotification(
          'error',
          'invoice.debit_note.load_error',
          'invoice.debit_note.title'
        );
      }
    });
  }

  addRow(): void {
    this.rows.push({ name: '', quantity: 1, price: null, taxRate: 0 });
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
    if (this.rows.length === 0) this.addRow();
  }

  /** Total con el mismo redondeo por línea que aplica Factus. */
  get total(): number {
    return this.rows.reduce((sum, r) => {
      const qty = Number(r.quantity ?? 0);
      const price = Number(r.price ?? 0);
      if (!(qty > 0) || !(price > 0)) return sum;
      const net = Math.round(qty * price * 100) / 100;
      const tax = Math.round((net * Number(r.taxRate ?? 0)) / 100 * 100) / 100;
      return sum + net + tax;
    }, 0);
  }

  get validRows(): ChargeRow[] {
    return this.rows.filter(
      (r) => r.name?.trim() && Number(r.quantity) > 0 && Number(r.price) > 0
    );
  }

  get canSubmit(): boolean {
    if (this.submitting || this.result || this.loading) return false;
    return this.validRows.length > 0;
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.submitting = true;

    const payload: CreateDebitNotePayload = {
      correctionConceptCode: this.conceptCode,
      observation: this.observation?.trim() || undefined,
      items: this.validRows.map((r) => ({
        name: r.name.trim(),
        quantity: Number(r.quantity),
        price: Number(r.price),
        taxRate: Number(r.taxRate ?? 0),
        // IPOCONSUMO va con código 04; todo lo demás (incluido "sin impuesto")
        // con 01, que es como lo espera Factus.
        taxCode: [8, 5].includes(Number(r.taxRate)) ? '04' : '01'
      }))
    };

    this._invoiceService
      .createDebitNote(this.data.invoiceId, payload)
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.result = res.data;
          this._notifications.showNotification(
            'success',
            'invoice.debit_note.success_msg',
            'invoice.debit_note.title'
          );
        },
        error: (err) => {
          this.submitting = false;
          const apiErrors = err?.error?.errors;
          const msg =
            Array.isArray(apiErrors) && apiErrors.length
              ? apiErrors.join(' · ')
              : (err?.error?.message ?? 'invoice.debit_note.error_msg');
          this._notifications.showNotification(
            'error',
            msg,
            'invoice.debit_note.title'
          );
        }
      });
  }

  close(): void {
    this._dialogRef.close(!!this.result);
  }
}
