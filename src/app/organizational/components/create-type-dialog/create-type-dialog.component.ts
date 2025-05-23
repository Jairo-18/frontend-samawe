import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TYPE_ENTITY_LABELS_ES } from '../../../shared/constants/type.contstants';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-create-type-dialog',
  standalone: true,
  imports: [
    BaseDialogComponent,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './create-type-dialog.component.html',
  styleUrls: ['./create-type-dialog.component.scss']
})
export class CreateTypeDialogComponent {
  formType!: FormGroup;

  private dialogRef = inject(MatDialogRef<CreateTypeDialogComponent>);

  typeOptions = Object.entries(TYPE_ENTITY_LABELS_ES).map(([key, value]) => ({
    key,
    value
  }));

  constructor(private _fb: FormBuilder) {
    this.formType = this._fb.group({
      selectedType: ['', Validators.required],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]]
    });
  }

  save() {
    if (this.formType.invalid) return;
    this.dialogRef.close(this.formType.value);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
