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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { ApplicationService } from '../../../organizational/services/application.service';
import { UsersService } from '../../../organizational/services/users.service';
import { AuthService } from '../../services/auth.service';
import { CustomValidationsService } from '../../../shared/validators/customValidations.service';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { LocationService } from '../../../shared/services/location.service';
import { Department, Municipality } from '../../../shared/interfaces/location.interface';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';
import {
  IdentificationType,
  PersonType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../shared/services/lang.service';

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
    ButtonLandingComponent,
    TranslateModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent implements OnInit, OnDestroy {
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _router: Router = inject(Router);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private readonly _langService = inject(LangService);
  private readonly _locationService = inject(LocationService);

  departments: Department[] = [];
  municipalities: Municipality[] = [];
  private allMunicipalities: Municipality[] = [];

  form: FormGroup;
  identificationType: IdentificationType[] = [];
  personType: PersonType[] = [];
  phoneCode: PhoneCode[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  loadingPhoneCodes: boolean = false;
  loading: boolean = true;
  isSaving: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  private profileSaved: boolean = false;

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
        departmentId: [''],
        municipalityId: [''],
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
      this._router.navigateByUrl(this._langService.route('auth/login'));
      return;
    }
    this.loadPendingProfile();
    this.loadRelatedData();
    this.setupPhoneCodeSearch();
    this.setupIdentificationTypeListener();
    this.setupLocation();
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
      const raw = this._localStorage.getItem('_pendingGoogleProfile');
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
        this.phoneCode = res.data?.phoneCode || [];
        this.filteredPhoneCodes = this.phoneCode.slice(0, 20);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this._applicationService.currentOrg$.subscribe((org) => {
      if (org) {
        this.form.patchValue(
          { organizationalId: org.organizationalId },
          { emitEvent: false }
        );
      }
    });
  }

  private setupPhoneCodeSearch(): void {
    this.form
      .get('phoneCodeSearch')
      ?.valueChanges.pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((term) => {
        if (typeof term !== 'string') return;
        const q = term.trim().toLowerCase();
        if (!q) {
          this.filteredPhoneCodes = this.phoneCode.slice(0, 20);
          return;
        }
        this.filteredPhoneCodes = this.phoneCode
          .filter(
            (pc) =>
              (pc.name || '').toLowerCase().includes(q) ||
              (pc.code || '').toLowerCase().includes(q)
          )
          .slice(0, 20);
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
    const isNit = selected.name?.['es']?.toUpperCase().includes('NIT');
    const match = isNit
      ? this.personType.find(
          (p) =>
            p.name?.['es']?.toUpperCase().includes('JURDICA') ||
            p.name?.['es']?.toUpperCase().includes('JUR\u00CDDICA') ||
            p.name?.['es']?.toUpperCase().includes('JURIDICA')
        )
      : this.personType.find((p) => p.name?.['es']?.toUpperCase().includes('NATURAL'));
    if (match) {
      this.form.patchValue(
        { personTypeId: match.personTypeId.toString() },
        { emitEvent: false }
      );
    }
  }

  // ── Ubicación DANE (departamento → municipio) ─────────────────────────────
  private setupLocation(): void {
    this._locationService.getDepartments().subscribe({
      next: (departments) => (this.departments = departments),
      error: (e) => console.error('Error al cargar departamentos:', e)
    });
    this._locationService.getAllMunicipalities().subscribe({
      next: (municipalities) => (this.allMunicipalities = municipalities),
      error: (e) => console.error('Error al cargar municipios:', e)
    });
    this.form.get('phoneCodeId')?.valueChanges.subscribe(() => this.onCountryChange());
    // Al cambiar el departamento se limpia el municipio y se refiltra la lista.
    this.form.get('departmentId')?.valueChanges.subscribe((deptId) => {
      this.form.get('municipalityId')?.setValue('', { emitEvent: false });
      this.municipalities = deptId
        ? this.allMunicipalities.filter((m) => m.departmentId === +deptId)
        : [];
    });
  }

  /**
   * La ubicación (departamento y municipio) solo tiene sentido si el país que
   * eligió es Colombia. Antes dependía del tipo de documento, y un extranjero
   * con cédula de extranjería veía igual campos que no le corresponden.
   */
  get showLocation(): boolean {
    const id = this.form.get('phoneCodeId')?.value;
    const selected = this.phoneCode.find(
      (pc) => String(pc.phoneCodeId) === String(id)
    );
    return (selected?.code ?? '').replace(/\s/g, '') === '+57';
  }

  /** Obligatorios solo con país Colombia; con otro país se limpian. */
  private onCountryChange(): void {
    const required = this.showLocation;
    const dept = this.form.get('departmentId');
    const muni = this.form.get('municipalityId');
    if (!required) {
      dept?.setValue('', { emitEvent: false });
      muni?.setValue('', { emitEvent: false });
      this.municipalities = [];
    }
    [dept, muni].forEach((c) => {
      if (required) c?.setValidators([Validators.required]);
      else c?.clearValidators();
      c?.updateValueAndValidity({ emitEvent: false });
    });
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
    this._localStorage.cleanLocalStorage();
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
        // Otro país: sin ubicación DANE (el backend la deja en null).
        departmentId: this.showLocation && v.departmentId ? +v.departmentId : null,
        municipalityId:
          this.showLocation && v.municipalityId ? +v.municipalityId : null,
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
          // `getUserEditPanel` cachea con shareReplay y el navbar ya la pidió
          // con los datos de relleno del alta con Google: sin invalidar, el
          // perfil enseñaba esos datos (país +93, sin teléfono) hasta recargar.
          // `notifyUserUpdated` vacía la caché y avisa al navbar.
          this._usersService.notifyUserUpdated(userId);
          this._localStorage.removeItem('_pendingGoogleProfile');
          this.isSaving = false;
          this._router.navigateByUrl(this._langService.route(''));
        },
        error: (err) => {
          console.error('Error al completar perfil:', err);
          this.isSaving = false;
        }
      });
  }
}
