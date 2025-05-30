import { Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';

@Component({
  selector: 'app-see-invoices',
  standalone: true,
  imports: [MatButtonModule, BasePageComponent],
  templateUrl: './see-invoices.component.html',
  styleUrl: './see-invoices.component.scss'
})
export class SeeInvoicesComponent {
  private readonly _matDialog: MatDialog = inject(MatDialog);

  isMobile: boolean = false;

  //   openDialog() {
  //     const isMobile = window.innerWidth <= 768; // Ajusta el breakpoint según tu necesidad

  //     const dialogRef = this._matDialog.open(CreateInvoiceDialogComponent, {
  //       width: isMobile ? '90vw' : 'auto', // 90% del viewport width en móvil, 100% en escritorio
  //       height: 'auto',
  //       maxWidth: '100vw', // Para evitar que supere el ancho de la pantalla
  //       data: {
  //         selectedType: this.selectedType,
  //         editMode: false
  //       }
  //     });

  //     dialogRef.afterClosed().subscribe((result) => {
  //       if (result) {
  //         this.loadGroupData(this.selectedType);
  //       }
  //     });
  //   }
}
