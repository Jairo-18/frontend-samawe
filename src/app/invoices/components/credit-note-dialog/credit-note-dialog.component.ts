import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  CreateCreditNotePayload,
  CreditNote,
  CreditNoteResult
} from '../../interface/creditNote.interface';

interface ItemRow {
  detail: InvoiceDetail;
  maxQty: number;
  selected: boolean;
  quantity: number;
}

export interface CreditNoteDialogData {
  invoiceId: number;
  invoiceCode: string;
  factusNumber?: string;
}

@Component({
  selector: 'app-credit-note-dialog',
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
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    FormatCopPipe,
    TranslatedPipe
  ],
  templateUrl: './credit-note-dialog.component.html',
  styleUrls: ['./credit-note-dialog.component.scss']
})
export class CreditNoteDialogComponent implements OnInit {
  private readonly _dialogRef = inject(
    MatDialogRef<CreditNoteDialogComponent>
  );
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _notifications = inject(NotificationsService);

  loading = true;
  submitting = false;
  isTotal = false;
  observation = '';
  rows: ItemRow[] = [];
  existing: CreditNote[] = [];
  result: CreditNoteResult | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: CreditNoteDialogData) {}

  ngOnInit(): void {
    forkJoin({
      invoice: this._invoiceService.getInvoiceToEdit(this.data.invoiceId),
      notes: this._invoiceService.getCreditNotes(this.data.invoiceId)
    }).subscribe({
      next: ({ invoice, notes }) => {
        this.existing = notes.data ?? [];

        // Cantidad ya acreditada por ítem en NC previas → el restante es el
        // máximo que se puede acreditar ahora (evita pasarse).
        const credited = new Map<number, number>();
        for (const note of this.existing) {
          for (const it of note.itemsSnapshot ?? []) {
            credited.set(
              it.invoiceDetailId,
              (credited.get(it.invoiceDetailId) ?? 0) + Number(it.quantity ?? 0)
            );
          }
        }

        const details = (invoice.data?.invoiceDetails ?? []).filter(
          (d) => !d.deletedAt
        );
        this.rows = details.map((detail) => {
          const original = Number(detail.amount ?? 1);
          const already = credited.get(detail.invoiceDetailId) ?? 0;
          const maxQty = Math.max(0, original - already);
          return { detail, maxQty, selected: false, quantity: maxQty };
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this._notifications.showNotification(
          'error',
          'invoice.credit_note.load_error',
          'invoice.credit_note.title'
        );
      }
    });
  }

  itemName(detail: InvoiceDetail): TranslatedField | null {
    return (
      detail.product?.name ??
      detail.accommodation?.name ??
      detail.excursion?.name ??
      null
    );
  }

  get canSubmit(): boolean {
    if (this.submitting || this.result) return false;
    if (this.isTotal) return true;
    return this.rows.some((r) => r.selected && r.quantity > 0);
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.submitting = true;

    const payload: CreateCreditNotePayload = {
      observation: this.observation?.trim() || undefined
    };
    if (this.isTotal) {
      payload.isTotal = true;
    } else {
      payload.items = this.rows
        .filter((r) => r.selected && r.quantity > 0)
        .map((r) => ({
          invoiceDetailId: r.detail.invoiceDetailId,
          quantity: r.quantity
        }));
    }

    this._invoiceService
      .createCreditNote(this.data.invoiceId, payload)
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.result = res.data;
          this._notifications.showNotification(
            'success',
            'invoice.credit_note.success_msg',
            'invoice.credit_note.title'
          );
        },
        error: (err) => {
          this.submitting = false;
          const apiErrors = err?.error?.errors;
          const msg =
            Array.isArray(apiErrors) && apiErrors.length
              ? apiErrors.join(' · ')
              : (err?.error?.message ?? 'invoice.credit_note.error_msg');
          this._notifications.showNotification(
            'error',
            msg,
            'invoice.credit_note.title'
          );
        }
      });
  }

  close(): void {
    this._dialogRef.close(!!this.result);
  }
}
