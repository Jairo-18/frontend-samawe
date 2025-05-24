import { Component, inject } from '@angular/core';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateTypeDialogComponent } from '../../components/create-type-dialog/create-type-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { CardTypesComponent } from '../../components/card-types/card-types.component';

@Component({
  selector: 'app-create-or-edit-types',
  standalone: true,
  imports: [
    BasePageComponent,
    ReactiveFormsModule,
    MatButtonModule,
    CardTypesComponent
  ],
  templateUrl: './create-or-edit-types.component.html',
  styleUrls: ['./create-or-edit-types.component.scss']
})
export class CreateOrEditTypesComponent {
  private readonly _relatedDataService = inject(RelatedDataService);
  private readonly _matDialog: MatDialog = inject(MatDialog);

  openDialog() {
    const dialogRef = this._matDialog.open(CreateTypeDialogComponent, {
      width: 'auto'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._relatedDataService
          .createType(result.selectedType, {
            code: result.code,
            name: result.name
          })
          .subscribe({
            error: (err) =>
              alert('Error: ' + (err.error?.message || err.message))
          });
      }
    });
  }
}
