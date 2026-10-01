import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import {
  DialogHighlight,
  YesNoDialogComponent
} from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { CurrencyFormatDirective } from '../../../shared/directives/currency-format.directive';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { PayType } from '../../../shared/interfaces/relatedDataGeneral';
import {
  CreditPayment,
  CreditStatus,
  InvoiceCredit
} from '../../interface/invoiceCredit.interface';

/**
 * Cartera de una factura a crédito: plazo (30/60/90 días = 1/2/3 cuotas),
 * abonos y saldo. Es control interno de samawe: a la DIAN solo llega el
 * vencimiento final al emitir la factura electrónica.
 */
@Component({
  selector: 'app-invoice-credit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyFormatDirective,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule,
    FormatCopPipe,
    TranslatedPipe
  ],
  templateUrl: './invoice-credit.component.html',
  styleUrl: './invoice-credit.component.scss'
})
export class InvoiceCreditComponent implements OnChanges {
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _notifications = inject(NotificationsService);
  private readonly _dialog = inject(MatDialog);
  private readonly _translate = inject(TranslateService);
  private readonly _formatCop = new FormatCopPipe();

  @Input({ required: true }) invoiceId!: number;
  /** Tipos de pago del catálogo; se ofrecen todos menos "crédito". */
  @Input() payTypes: PayType[] = [];
  /** Validada por la DIAN: el vencimiento ya viajó y el plazo no se cambia. */
  @Input() dueDateLocked = false;
  /** Cambió algo (plazo o abono): el padre puede refrescar la factura. */
  @Output() changed = new EventEmitter<void>();

  readonly creditDaysOptions = [30, 60, 90];
  credit: InvoiceCredit | null = null;
  loading = true;
  saving = false;

  /**
   * Monto del abono. Es un FormControl (no ngModel) porque `appCurrencyFormat`
   * escribe directo al control y con `ngModel` la variable no se enteraba.
   */
  readonly amountControl = new FormControl<number | null>(null);

  /** Valor absoluto de las notas, para mostrar "+/−" aparte del número. */
  get absNotes(): number {
    return Math.abs(this.credit?.notesNet ?? 0);
  }

  get amount(): number | null {
    return this.amountControl.value;
  }

  /** Llena el monto con el saldo pendiente (atajo para abonar todo o editarlo). */
  fillBalance(): void {
    if (this.credit && this.credit.balance > 0) {
      this.amountControl.setValue(this.credit.balance);
    }
  }
  payTypeId: number | null = null;
  paidAt: Date | null = null;
  note = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['invoiceId'] && this.invoiceId) this.load();
    if (changes['payTypes']) this._defaultPayType();
  }

  /**
   * El abono casi siempre es en efectivo: se preselecciona (código `EFE`) para
   * no registrar abonos sin medio. Solo si el usuario aún no eligió otro.
   */
  private _defaultPayType(): void {
    if (this.payTypeId) return;
    const cash = this.payTypeOptions.find((p) => p.code?.toUpperCase() === 'EFE');
    if (cash) this.payTypeId = cash.payTypeId;
  }

  get payTypeOptions(): PayType[] {
    return this.payTypes.filter((p) => p.code !== 'CRE');
  }

  installmentsFor(days: number): number {
    return days / 30;
  }

  /** Un abono no puede ser a futuro: el calendario no deja pasar de hoy. */
  readonly maxDate = new Date();

  /** `YYYY-MM-DD` en hora local (toISOString lo correría un día por UTC). */
  private _toDateOnly(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  statusKey(status: CreditStatus): string {
    return `invoice.credit.status_${status.toLowerCase()}`;
  }

  statusClass(status: CreditStatus): string {
    switch (status) {
      case 'PAID':
        return 'bg-[var(--success-bg)] !text-[var(--success)]';
      case 'PARTIAL':
        return 'bg-[var(--info-bg)] !text-[var(--info)]';
      case 'OVERDUE':
        return 'bg-[var(--danger-bg)] !text-[var(--danger)]';
      default:
        return 'bg-[var(--warning-bg)] !text-[var(--warning)]';
    }
  }

  load(): void {
    this.loading = true;
    this._invoiceService.getCredit(this.invoiceId).subscribe({
      next: (res) => {
        this.credit = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this._fail(err);
      }
    });
  }

  /**
   * Cambiar el plazo NO toca los abonos (se guardan sueltos y se reaplican a la
   * cuota más antigua del plan nuevo), pero sí reinicia el calendario: el plazo
   * cuenta desde hoy. Eso puede esconder una mora, así que si ya hay abonos o
   * cuotas vencidas se pide confirmar diciendo exactamente qué va a pasar.
   * La primera vez que se elige plazo no hay nada que advertir.
   */
  setDays(days: number): void {
    const credit = this.credit;
    if (this.saving || this.dueDateLocked || credit?.creditDays === days) return;
    const hadOverdue = !!credit?.installments.some((i) => i.status === 'OVERDUE');
    if (credit?.creditDays && (credit.paid > 0 || hadOverdue)) {
      const due = new Date();
      due.setDate(due.getDate() + days);
      const paid = this._formatCop.transform(credit.paid);
      const dueText = formatDate(due, 'dd/MM/yyyy', 'en-US');
      const term = `${credit.creditDays} → ${days} ${this._translate.instant('invoice.credit.days')}`;
      const lines = [
        this._translate.instant('invoice.credit.change_term_msg', {
          term,
          paid,
          due: dueText
        })
      ];
      const highlights: DialogHighlight[] = [term, paid, dueText];
      if (hadOverdue) {
        const warn = this._translate.instant('invoice.credit.change_term_overdue');
        lines.push(warn);
        highlights.push({ text: warn, tone: 'warn' });
      }
      this._confirm(
        'invoice.credit.change_term_title',
        lines.join(' '),
        () => this._applyDays(days),
        highlights
      );
      return;
    }
    this._applyDays(days);
  }

  private _applyDays(days: number): void {
    this.saving = true;
    this._invoiceService.setCreditDays(this.invoiceId, days).subscribe({
      next: (res) => this._applied(res.data),
      error: (err) => this._fail(err)
    });
  }

  /** Botón "Registrar abono": valida y pide confirmar con el detalle. */
  requestAddPayment(): void {
    if (this.saving || !this.credit || !this.amount || this.amount <= 0) return;
    if (this.amount > this.credit.balance) {
      this._notifications.showNotification(
        'error',
        'invoice.credit.amount_exceeds',
        'invoice.credit.title'
      );
      return;
    }
    const amount = this.amount;
    const { message, highlights } = this._paymentMessage(
      'invoice.credit.add_confirm_msg',
      amount
    );
    this._confirm(
      'invoice.credit.add_confirm_title',
      message,
      () => this._register(amount),
      highlights
    );
  }

  /** Botón "Abonar el saldo": registra el saldo completo, previa confirmación. */
  requestPayAllBalance(): void {
    if (this.saving || !this.credit || this.credit.balance <= 0) return;
    const amount = this.credit.balance;
    const { message, highlights } = this._paymentMessage(
      'invoice.credit.pay_all_confirm_msg',
      amount
    );
    this._confirm(
      'invoice.credit.pay_all_confirm_title',
      message,
      () => this._register(amount),
      highlights
    );
  }

  /** Texto de confirmación con monto, medio, fecha y cómo queda el saldo. */
  private _paymentMessage(
    key: string,
    amount: number
  ): { message: string; highlights: DialogHighlight[] } {
    const balance = this.credit?.balance ?? 0;
    const left = Math.round((balance - amount) * 100) / 100;
    const method: any = this.payTypeName(this.payTypeId);
    const lang = this._translate.currentLang ?? 'es';
    const methodText = method
      ? (method[lang] ?? method['es'] ?? '')
      : this._translate.instant('invoice.credit.no_method');
    const params = {
      amount: this._formatCop.transform(amount),
      method: methodText,
      date: formatDate(this.paidAt ?? new Date(), 'dd/MM/yyyy', 'en-US'),
      balance: this._formatCop.transform(balance),
      left: this._formatCop.transform(left)
    };
    const text = this._translate.instant(key, params);
    const highlights: DialogHighlight[] = [
      params.amount,
      params.method,
      params.date,
      params.balance,
      params.left
    ];
    if (left <= 0) {
      const settled = this._translate.instant('invoice.credit.will_be_settled');
      highlights.push({ text: settled, tone: 'success' });
      return { message: `${text} ${settled}`, highlights };
    }
    return { message: text, highlights };
  }

  private _confirm(
    titleKey: string,
    message: string,
    onYes: () => void,
    highlights: DialogHighlight[] = []
  ): void {
    this._dialog
      .open(YesNoDialogComponent, {
        data: { title: this._translate.instant(titleKey), message, highlights }
      })
      .afterClosed()
      .subscribe((yes) => {
        if (yes) onYes();
      });
  }

  private _register(amount: number): void {
    this.saving = true;
    this._invoiceService
      .addCreditPayment(this.invoiceId, {
        amount,
        ...(this.payTypeId ? { payTypeId: this.payTypeId } : {}),
        ...(this.paidAt ? { paidAt: this._toDateOnly(this.paidAt) } : {}),
        ...(this.note.trim() ? { note: this.note.trim() } : {})
      })
      .subscribe({
        next: (res) => {
          this.amountControl.reset();
          this.note = '';
          this.paidAt = null;
          this._applied(res.data);
        },
        error: (err) => this._fail(err)
      });
  }

  /** Borrar un abono cambia el saldo y las cuotas: se pide confirmar antes. */
  confirmDeletePayment(payment: CreditPayment): void {
    if (this.saving) return;
    const amount = this._formatCop.transform(payment.amount);
    this._confirm(
      'invoice.credit.delete_confirm_title',
      this._translate.instant('invoice.credit.delete_confirm_msg', { amount }),
      () => this.deletePayment(payment.invoicePaymentId),
      [{ text: amount, tone: 'danger' }]
    );
  }

  deletePayment(paymentId: number): void {
    if (this.saving) return;
    this.saving = true;
    this._invoiceService
      .deleteCreditPayment(this.invoiceId, paymentId)
      .subscribe({
        next: (res) => this._applied(res.data),
        error: (err) => this._fail(err)
      });
  }

  payTypeName(id: number | null) {
    return this.payTypes.find((p) => p.payTypeId === id)?.name;
  }

  private _applied(credit: InvoiceCredit): void {
    this.credit = credit;
    this.saving = false;
    this.changed.emit();
  }

  private _fail(err: any): void {
    this.saving = false;
    const apiErrors = err?.error?.errors;
    const msg =
      Array.isArray(apiErrors) && apiErrors.length
        ? apiErrors.join(' · ')
        : (err?.error?.message ?? 'invoice.credit.error_generic');
    this._notifications.showNotification(
      'error',
      msg,
      'invoice.credit.title'
    );
  }
}
