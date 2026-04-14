import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { UsersService } from '../../../organizational/services/users.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { UserComplete } from '../../../organizational/interfaces/create.interface';
import {
  IdentificationType,
  PersonType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    BasePageComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly _usersService = inject(UsersService);
  private readonly _authService = inject(AuthService);
  private readonly _relatedDataService = inject(RelatedDataService);
  private readonly _fb = inject(FormBuilder);

  user: UserComplete | null = null;
  loading = true;
  saving = false;
  editMode = false;

  identificationTypes: IdentificationType[] = [];
  phoneCodes: PhoneCode[] = [];
  personTypes: PersonType[] = [];

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this._fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      phoneCode: ['', Validators.required],
      identificationNumber: ['', Validators.required],
      identificationType: ['', Validators.required],
      personType: ['']
    });

    this._relatedDataService.getRelatedData().subscribe((res) => {
      this.identificationTypes = res.data.identificationType;
      this.phoneCodes = res.data.phoneCode;
      this.personTypes = res.data.personType;
    });

    const userId = this._authService.getCurrentUserId();
    if (userId) {
      this._usersService.getUserEditPanel(userId).subscribe({
        next: (res) => {
          this.user = res.data;
          this._patchForm(res.data);
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }

  private _patchForm(user: UserComplete): void {
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      phoneCode: user.phoneCode?.phoneCodeId,
      identificationNumber: user.identificationNumber,
      identificationType: user.identificationType?.identificationTypeId,
      personType: user.personType?.personTypeId
    });
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.user) {
      this._patchForm(this.user);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this._authService.getCurrentUserId();
    if (!userId) return;

    this.saving = true;
    this._usersService.updateUserProfile(userId, this.form.getRawValue()).subscribe({
      next: () => {
        this._usersService.getUserEditPanel(userId).subscribe((res) => {
          this.user = res.data;
          this.editMode = false;
          this.saving = false;
        });
      },
      error: () => { this.saving = false; }
    });
  }
}
