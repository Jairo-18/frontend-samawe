import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { NormalizeNameDirective } from '../../../shared/directives/normalize-name.directive';
import { NoSpacesDirective } from '../../../shared/directives/no-spaces.directive';
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
    MatProgressSpinnerModule,
    ButtonLandingComponent,
    NormalizeNameDirective,
    NoSpacesDirective,
    BasePageComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _fb: FormBuilder = inject(FormBuilder);

  user: UserComplete | null = null;
  loading: boolean = true;
  saving: boolean = false;
  editMode: boolean = false;
  avatarUploading: boolean = false;
  avatarPreviewOpen: boolean = false;

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
        error: () => {
          this.loading = false;
        }
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

  openAvatarPreview(): void {
    this.avatarPreviewOpen = true;
  }

  closeAvatarPreview(): void {
    this.avatarPreviewOpen = false;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const userId = this._authService.getCurrentUserId();
    if (!userId) return;

    this.avatarUploading = true;
    this._usersService.uploadAvatar(userId, file).subscribe({
      next: () => {
        this._usersService.getUserEditPanel(userId).subscribe((res) => {
          this.user = res.data;
          this.avatarUploading = false;
        });
      },
      error: () => {
        this.avatarUploading = false;
      }
    });
    input.value = '';
  }

  deleteAvatar(): void {
    const userId = this._authService.getCurrentUserId();
    if (!userId) return;

    this.avatarUploading = true;
    this.avatarPreviewOpen = false;
    this._usersService.deleteAvatar(userId).subscribe({
      next: () => {
        if (this.user) this.user = { ...this.user, avatarUrl: undefined };
        this.avatarUploading = false;
      },
      error: () => {
        this.avatarUploading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this._authService.getCurrentUserId();
    if (!userId) return;

    this.saving = true;
    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      identificationType: String(raw.identificationType),
      phoneCode: String(raw.phoneCode),
      personType: raw.personType != null ? String(raw.personType) : undefined
    };
    this._usersService.updateUserProfile(userId, body).subscribe({
      next: () => {
        this._usersService.getUserEditPanel(userId).subscribe((res) => {
          this.user = res.data;
          this.editMode = false;
          this.saving = false;
        });
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
