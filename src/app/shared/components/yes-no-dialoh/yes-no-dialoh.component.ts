import { Component, EventEmitter, inject, Output } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-yes-no-dialoh',
  imports: [BaseDialogComponent, MatButtonModule],
  templateUrl: './yes-no-dialoh.component.html',
  styleUrl: './yes-no-dialoh.component.scss',
})
export class YesNoDialohComponent {
  private readonly _dialogRef: MatDialogRef<YesNoDialohComponent> = inject(
    MatDialogRef<YesNoDialohComponent>
  );
  readonly data = inject<{ title: string; description: string }>(
    MAT_DIALOG_DATA
  );
  loading: boolean = false;

  @Output() yesEvent = new EventEmitter<boolean>();

  close() {
    this._dialogRef.close();
  }

  confirm() {
    this.loading = true;
    this.yesEvent.emit(true);
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }
}
