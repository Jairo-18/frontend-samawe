import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { UsersService } from '../../../organizational/services/users.service';
import { AuthService } from '../../services/auth.service';
import { CustomValidationsService } from '../../../shared/validators/customValidations.service';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';
import {
  IdentificationType,
  PersonType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UppercaseDirective,
    ButtonLandingComponent
  ],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent implements OnInit, OnDestroy {
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _router: Router = inject(Router);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );

  form: FormGroup;
  identificationType: IdentificationType[] = [];
  personType: PersonType[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  loadingPhoneCodes = false;
  loading = true;
  isSaving = false;
  showPassword = false;
  showConfirmPassword = false;
  private profileSaved = false;

  constructor() {
    this.form = this._fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        identificationTypeId: ['', Validators.required],
        identificationNumber: ['', Validators.required],
        phoneCodeSearch: [''],
        phoneCodeId: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
        personTypeId: [''],
        organizationalId: [''],
        password: ['', [this._customValidations.passwordStrength()]],
        confirmPassword: [{ value: '', disabled: true }]
      },
      {
        validators: this._customValidations.passwordsMatch(
          'password',
          'confirmPassword'
        )
      }
    );
  }

  ngOnInit(): void {
    if (!this._authService.getCurrentUserId()) {
      this._router.navigateByUrl('/auth/login');
      return;
    }
    this.loadPendingProfile();
    this.loadRelatedData();
    this.setupPhoneCodeSearch();
    this.setupIdentificationTypeListener();
    this.form.get('password')?.valueChanges.subscribe((value) => {
      const confirmCtrl = this.form.get('confirmPassword');
      if (!value) {
        confirmCtrl?.disable();
        confirmCtrl?.reset();
      } else {
        confirmCtrl?.enable();
      }
    });
  }

  private loadPendingProfile(): void {
    try {
      const raw = localStorage.getItem('_pendingGoogleProfile');
      if (raw) {
        const profile = JSON.parse(raw);
        const phone = this.extractPhoneFromEmail(profile.email || '');
        this.form.patchValue({
          firstName: profile.firstName?.toUpperCase() || '',
          lastName: profile.lastName?.toUpperCase() || '',
          ...(phone && { phone })
        });
      }
    } catch (_) {}
  }

  private extractPhoneFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    const digits = localPart.replace(/\D/g, '');
    return digits.length >= 7 ? digits : '';
  }

  private loadRelatedData(): void {
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        this.identificationType = res.data?.identificationType || [];
        this.personType = res.data?.personType || [];
        const orgs = res.data?.organizational || [];
        if (orgs.length > 0) {
          this.form.patchValue(
            { organizationalId: orgs[0].organizationalId },
            { emitEvent: false }
          );
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private setupPhoneCodeSearch(): void {
    this.loadPhoneCodes('');
    this.form
      .get('phoneCodeSearch')
      ?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((term: string) => {
          if (typeof term !== 'string') {
            return of({ data: this.filteredPhoneCodes, meta: {} });
          }
          this.loadingPhoneCodes = true;
          return this._relatedDataService.searchPhoneCodes(term, 1, 20);
        })
      )
      .subscribe({
        next: (res) => {
          this.filteredPhoneCodes = (res as any).data || [];
          this.loadingPhoneCodes = false;
        },
        error: () => {
          this.filteredPhoneCodes = [];
          this.loadingPhoneCodes = false;
        }
      });
  }

  private loadPhoneCodes(search: string): void {
    this.loadingPhoneCodes = true;
    this._relatedDataService.searchPhoneCodes(search, 1, 20).subscribe({
      next: (res) => {
        this.filteredPhoneCodes = res.data || [];
        this.loadingPhoneCodes = false;
      },
      error: () => {
        this.filteredPhoneCodes = [];
        this.loadingPhoneCodes = false;
      }
    });
  }

  private setupIdentificationTypeListener(): void {
    this.form
      .get('identificationTypeId')
      ?.valueChanges.subscribe((id: string) => {
        this.applyPersonType(id);
      });
  }

  private applyPersonType(identificationTypeId: string): void {
    const selected = this.identificationType.find(
      (t) => t.identificationTypeId?.toString() === identificationTypeId
    );
    if (!selected) return;
    const isNit = selected.name?.toUpperCase().includes('NIT');
    const match = isNit
      ? this.personType.find(
          (p) =>
            p.name?.toUpperCase().includes('JURDICA') ||
            p.name?.toUpperCase().includes('JUR\u00CDDICA') ||
            p.name?.toUpperCase().includes('JURIDICA')
        )
      : this.personType.find((p) => p.name?.toUpperCase().includes('NATURAL'));
    if (match) {
      this.form.patchValue(
        { personTypeId: match.personTypeId.toString() },
        { emitEvent: false }
      );
    }
  }

  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode ? `${phoneCode.code} ${phoneCode.name}` : '';
  }

  onPhoneCodeSelected(phoneCode: PhoneCode): void {
    if (phoneCode?.phoneCodeId) {
      this.form.patchValue({ phoneCodeId: phoneCode.phoneCodeId.toString() });
    }
  }

  ngOnDestroy(): void {
    if (this.profileSaved || this.isSaving) return;
    const userId = this._authService.getCurrentUserId();
    const token = this._authService.getAuthToken();
    if (userId && token) {
      fetch(`${environment.apiUrl}user/${userId}`, {
        method: 'DELETE',
        keepalive: true,
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    localStorage.clear();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this._authService.getCurrentUserId();
    if (!userId) return;

    const v = this.form.getRawValue();
    this.isSaving = true;

    this._usersService
      .updateUser(userId, {
        firstName: v.firstName,
        lastName: v.lastName,
        identificationType: v.identificationTypeId,
        identificationNumber: v.identificationNumber,
        phoneCode: v.phoneCodeId,
        phone: v.phone,
        ...(v.personTypeId && { personType: v.personTypeId }),
        ...(v.organizationalId && { organizationalId: v.organizationalId }),
        ...(v.password && {
          password: v.password,
          confirmPassword: v.confirmPassword
        })
      })
      .subscribe({
        next: () => {
          this.profileSaved = true;
          localStorage.removeItem('_pendingGoogleProfile');
          this.isSaving = false;
          this._router.navigateByUrl('/home');
        },
        error: (err) => {
          console.error('Error al completar perfil:', err);
          this.isSaving = false;
        }
      });
  }
}
