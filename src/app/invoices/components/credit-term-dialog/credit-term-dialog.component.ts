import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatDate } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

/**
 * Elegir el plazo (30/60/90 días) al emitir una factura a crédito. Factus exige
 * `due_date` cuando la forma de pago es crédito, y ese vencimiento sale del
 * plazo: aquí se fija en el momento en que hace falta, sin tener que ir antes
 * al panel de "Crédito y abonos". Cuenta desde hoy, igual que allá.
 */
@Component({
  selector: 'app-credit-term-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatRadioModule,
    TranslateModule,
    BaseDialogComponent
  ],
  templateUrl: './credit-term-dialog.component.html'
})
export class CreditTermDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<CreditTermDialogComponent>);
  readonly data: { code: string; expired: boolean } = inject(MAT_DIALOG_DATA);

  readonly options = [30, 60, 90].map((days) => {
    const due = new Date();
    due.setDate(due.getDate() + days);
    return {
      days,
      installments: days / 30,
      due: formatDate(due, 'dd/MM/yyyy', 'en-US')
    };
  });
  selected: number | null = null;

  confirm(): void {
    if (this.selected) this._dialogRef.close(this.selected);
  }

  cancel(): void {
    this._dialogRef.close(null);
  }
}
