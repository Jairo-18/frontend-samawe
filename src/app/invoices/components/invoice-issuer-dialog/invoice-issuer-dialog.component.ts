import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

/** Emisor elegido al imprimir/descargar una factura de venta normal. */
export type InvoiceIssuer = 'org' | 'owner';

@Component({
  selector: 'app-invoice-issuer-dialog',
  standalone: true,
  imports: [
    BaseDialogComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './invoice-issuer-dialog.component.html'
})
export class InvoiceIssuerDialogComponent {
  private readonly _dialogRef = inject(
    MatDialogRef<InvoiceIssuerDialogComponent>
  );
  /** hasOwner: si la organización tiene un propietario (representante legal) vinculado. */
  data: { hasOwner: boolean } = inject(MAT_DIALOG_DATA);

  choose(issuer: InvoiceIssuer): void {
    this._dialogRef.close(issuer);
  }
}
