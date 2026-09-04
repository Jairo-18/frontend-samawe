import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_AVATAR } from '../../../shared/constants/avatar.constants';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
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
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import { TranslateModule } from '@ngx-translate/core';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { LocationService } from '../../../shared/services/location.service';
import {
  Department,
  Municipality
} from '../../../shared/interfaces/location.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ButtonLandingComponent,
    NormalizeNameDirective,
    NoSpacesDirective,
    BasePageComponent,
    TranslateModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _locationService: LocationService = inject(LocationService);
  private readonly _fb: FormBuilder = inject(FormBuilder);

  /** La ubicación DANE solo aplica a documentos colombianos. */
  private readonly COLOMBIAN_DOC_CODES = ['CC', 'NIT', 'TI', 'RC'];

  user: UserComplete | null = null;
  loading: boolean = true;
  saving: boolean = false;
  editMode: boolean = false;
  avatarPreviewOpen: boolean = false;

  /** Foto elegida pero aún no subida (se aplica al guardar). */
  pendingAvatarFile: File | null = null;
  /** Object URL de la foto pendiente, para la vista previa local. */
  pendingAvatarPreview: string | null = null;
  /** El usuario pidió quitar la foto; se borra al guardar. */
  pendingAvatarRemoved: boolean = false;

  readonly defaultAvatar = DEFAULT_AVATAR;

  identificationTypes: IdentificationType[] = [];
  phoneCodes: PhoneCode[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  loadingPhoneCodes: boolean = true;

  departments: Department[] = [];
  private allMunicipalities: Municipality[] = [];
  /** Municipios del departamento elegido. */
  municipalities: Municipality[] = [];

  form!: FormGroup;

  ngOnInit(): void {
    // El correo NO es editable desde el perfil (se muestra aparte, leyendo de
    // `user`), así que no tiene control. `personType` tampoco: el backend lo
    // deriva del tipo de documento en cada update (resolvePersonType) e ignora
    // el que se le mande, y el rol no se le muestra al usuario.
    this.form = this._fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      phoneCodeId: ['', Validators.required],
      phoneCodeSearch: [''],
      identificationNumber: ['', Validators.required],
      identificationType: ['', Validators.required],
      departmentId: [''],
      municipalityId: ['']
    });

    this._setupPhoneCodeSearch();
    this._setupDepartmentListener();
    this._setupDocTypeListener();
    this._loadLocationCatalogs();

    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        this.identificationTypes = res.data.identificationType;
        this.phoneCodes = res.data.phoneCode || [];
        this.filteredPhoneCodes = this.phoneCodes.slice(0, 20);
        this.loadingPhoneCodes = false;
        // Los códigos pueden llegar después del usuario; re-aplicamos para que
        // el autocomplete muestre el país ya seleccionado.
        if (this.user) this._patchForm(this.user);
      },
      error: () => {
        this.loadingPhoneCodes = false;
      }
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
      phone: user.phone,
      phoneCodeId: user.phoneCode?.phoneCodeId
        ? String(user.phoneCode.phoneCodeId)
        : '',
      // El autocomplete guarda el objeto completo; `displayPhoneCode` lo pinta.
      phoneCodeSearch: user.phoneCode ?? '',
      identificationNumber: user.identificationNumber,
      identificationType: user.identificationType?.identificationTypeId
    });

    // El departamento se asigna sin emitir evento: el listener limpiaría el
    // municipio recién cargado. El filtrado se hace a mano justo después.
    const deptId = user.department?.departmentId ?? '';
    this.form.get('departmentId')?.setValue(deptId, { emitEvent: false });
    this.filterMunicipalities(deptId ? +deptId : null);
    this.form
      .get('municipalityId')
      ?.setValue(user.municipality?.municipalityId ?? '', { emitEvent: false });

    this.updateLocationValidators();
  }

  // ── Ubicación DANE (departamento → municipio) ─────────────────────────────
  private _loadLocationCatalogs(): void {
    this._locationService.getDepartments().subscribe({
      next: (departments) => (this.departments = departments),
      error: (e) => console.error('Error al cargar departamentos:', e)
    });
    this._locationService.getAllMunicipalities().subscribe({
      next: (municipalities) => {
        this.allMunicipalities = municipalities;
        // El catálogo puede llegar después del usuario: refiltra con lo elegido.
        const deptId = this.form.get('departmentId')?.value;
        if (deptId) {
          const current = this.form.get('municipalityId')?.value;
          this.filterMunicipalities(+deptId);
          this.form
            .get('municipalityId')
            ?.setValue(current ?? '', { emitEvent: false });
        }
      },
      error: (e) => console.error('Error al cargar municipios:', e)
    });
  }

  /** Al cambiar el departamento se limpia el municipio y se refiltra la lista. */
  private _setupDepartmentListener(): void {
    this.form.get('departmentId')?.valueChanges.subscribe((deptId) => {
      this.form.get('municipalityId')?.setValue('', { emitEvent: false });
      this.filterMunicipalities(deptId ? +deptId : null);
    });
  }

  /** Documento extranjero → la ubicación DANE no aplica y se limpia. */
  private _setupDocTypeListener(): void {
    this.form.get('identificationType')?.valueChanges.subscribe(() => {
      if (!this.showLocation) {
        this.form.get('departmentId')?.setValue('', { emitEvent: false });
        this.form.get('municipalityId')?.setValue('', { emitEvent: false });
        this.municipalities = [];
      }
      this.updateLocationValidators();
    });
  }

  private filterMunicipalities(departmentId: number | null): void {
    this.municipalities = departmentId
      ? this.allMunicipalities.filter((m) => m.departmentId === departmentId)
      : [];
  }

  /** Obligatorios solo si el documento es colombiano (selects visibles). */
  private updateLocationValidators(): void {
    const required = this.showLocation;
    const apply = (control: AbstractControl | null) => {
      if (required) control?.setValidators([Validators.required]);
      else control?.clearValidators();
      control?.updateValueAndValidity({ emitEvent: false });
    };
    apply(this.form.get('departmentId'));
    apply(this.form.get('municipalityId'));
  }

  /** Código del tipo de documento seleccionado (CC, NIT, CE, PAS, ...). */
  get selectedDocCode(): string {
    const id = this.form?.get('identificationType')?.value;
    return (
      this.identificationTypes.find(
        (t) => String(t.identificationTypeId) === String(id)
      )?.code ?? ''
    );
  }

  get showLocation(): boolean {
    return this.COLOMBIAN_DOC_CODES.includes(this.selectedDocCode);
  }

  // ── Buscador de país (mismo patrón que create-or-edit-users) ──────────────
  private _setupPhoneCodeSearch(): void {
    this.form
      .get('phoneCodeSearch')
      ?.valueChanges.pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((term) => {
        if (typeof term !== 'string') return;
        const q = term.trim().toLowerCase();
        if (!q) {
          this.filteredPhoneCodes = this.phoneCodes.slice(0, 20);
          return;
        }
        this.filteredPhoneCodes = this.phoneCodes
          .filter(
            (pc) =>
              (pc.name || '').toLowerCase().includes(q) ||
              (pc.code || '').toLowerCase().includes(q)
          )
          .slice(0, 20);
      });
  }

  // Se usa como [displayWith], sin contexto `this`, por eso se instancia el pipe.
  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode
      ? `${phoneCode.code} ${new CapitalizePipe().transform(phoneCode.name)}`
      : '';
  }

  get isPhoneCodeSelected(): boolean {
    const val = this.form.get('phoneCodeSearch')?.value;
    return typeof val === 'object' && val !== null;
  }

  onPhoneCodeSelected(phoneCode: PhoneCode): void {
    if (phoneCode && phoneCode.phoneCodeId) {
      this.form.patchValue({ phoneCodeId: String(phoneCode.phoneCodeId) });
      this.form.get('phoneCodeSearch')?.setErrors(null);
    }
  }

  clearPhoneCodeSelection(): void {
    this.form.patchValue({ phoneCodeId: '', phoneCodeSearch: '' });
    this.form.get('phoneCodeSearch')?.setErrors(null);
    this.filteredPhoneCodes = this.phoneCodes.slice(0, 20);
  }

  onPhoneCodeFocus(): void {
    if (!this.isPhoneCodeSelected && !this.form.get('phoneCodeSearch')?.value) {
      this.filteredPhoneCodes = this.phoneCodes.slice(0, 20);
    }
  }

  get phoneCodeLabel(): string {
    const pc = this.user?.phoneCode;
    return pc ? `${pc.code} ${pc.name}` : '';
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Cancelar descarta también la foto pendiente, no solo los campos.
      this._discardPendingAvatar();
      if (this.user) this._patchForm(this.user);
      this.form.markAsPristine();
    }
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  // La foto ya NO se sube al elegirla: se deja "pendiente" y se aplica al
  // guardar, junto con el resto de los datos. Antes bastaba con abrir el visor
  // para reemplazar la foto sin entrar en modo edición.

  /** Lo que se pinta: primero la pendiente, luego la guardada, luego el genérico. */
  get displayAvatarUrl(): string {
    if (this.pendingAvatarPreview) return this.pendingAvatarPreview;
    if (this.pendingAvatarRemoved) return DEFAULT_AVATAR;
    return this.user?.avatarUrl || DEFAULT_AVATAR;
  }

  get hasPendingAvatarChange(): boolean {
    return !!this.pendingAvatarFile || this.pendingAvatarRemoved;
  }

  get hasUnsavedChanges(): boolean {
    return this.editMode && (this.form.dirty || this.hasPendingAvatarChange);
  }

  /** Solo hay foto que borrar si ya existe una guardada y no se quitó ya. */
  get canRemoveAvatar(): boolean {
    return !!this.user?.avatarUrl && !this.pendingAvatarRemoved;
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
    input.value = '';
    if (!file) return;

    this._revokePreview();
    this.pendingAvatarFile = file;
    this.pendingAvatarRemoved = false;
    // Vista previa local: no se sube nada todavía.
    this.pendingAvatarPreview = URL.createObjectURL(file);
    this.avatarPreviewOpen = false;
  }

  markAvatarForRemoval(): void {
    this._revokePreview();
    this.pendingAvatarFile = null;
    this.pendingAvatarRemoved = true;
    this.avatarPreviewOpen = false;
  }

  private _discardPendingAvatar(): void {
    this._revokePreview();
    this.pendingAvatarFile = null;
    this.pendingAvatarRemoved = false;
  }

  private _revokePreview(): void {
    if (this.pendingAvatarPreview) {
      URL.revokeObjectURL(this.pendingAvatarPreview);
      this.pendingAvatarPreview = null;
    }
  }

  ngOnDestroy(): void {
    this._revokePreview();
  }

  // ── Guardado ──────────────────────────────────────────────────────────────
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this._authService.getCurrentUserId();
    if (!userId) return;

    this.saving = true;
    const raw = this.form.getRawValue();
    // `phoneCodeSearch` es solo de UI y el correo no se edita aquí: ninguno
    // viaja en el payload.
    // Extranjeros (CE/PAS): se mandan en null para que el backend limpie la
    // ubicación y el factusMunicipalityCode; la factura usa el del negocio.
    const isColombian = this.showLocation;
    const body = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      phone: raw.phone,
      identificationNumber: raw.identificationNumber,
      identificationType: String(raw.identificationType),
      phoneCode: String(raw.phoneCodeId),
      departmentId: isColombian && raw.departmentId ? +raw.departmentId : null,
      municipalityId:
        isColombian && raw.municipalityId ? +raw.municipalityId : null
    };

    this._usersService.updateUserProfile(userId, body).subscribe({
      next: () => this._applyPendingAvatar(userId),
      error: () => {
        this.saving = false;
      }
    });
  }

  /**
   * Aplica la foto pendiente (si la hay) después de guardar los datos y recarga
   * el usuario. La recarga va siempre con `forceRefresh`: `getUserEditPanel`
   * cachea con `shareReplay`, así que sin eso se releería el avatar anterior.
   */
  private _applyPendingAvatar(userId: string): void {
    const finish = () => this._reloadUser(userId);

    if (this.pendingAvatarFile) {
      this._usersService
        .uploadAvatar(userId, this.pendingAvatarFile)
        .subscribe({ next: finish, error: finish });
      return;
    }
    if (this.pendingAvatarRemoved) {
      this._usersService
        .deleteAvatar(userId)
        .subscribe({ next: finish, error: finish });
      return;
    }
    finish();
  }

  private _reloadUser(userId: string): void {
    this._usersService.getUserEditPanel(userId, true).subscribe({
      next: (res) => {
        this.user = res.data;
        this._discardPendingAvatar();
        this._patchForm(res.data);
        this.form.markAsPristine();
        this.editMode = false;
        this.saving = false;
        // Avisa al navbar (y a quien escuche) para que repinte el avatar: carga
        // el usuario una sola vez al arrancar y si no, se quedaba con el viejo.
        this._usersService.notifyUserUpdated(userId);
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
