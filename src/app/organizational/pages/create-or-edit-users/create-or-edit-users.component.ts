import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import * as uuid from 'uuid';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIcon } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { LocationService } from '../../../shared/services/location.service';
import { CreateUserPanel } from '../../interfaces/create.interface';
import {
  IdentificationType,
  PhoneCode,
  RoleType,
  PersonType
} from '../../../shared/interfaces/relatedDataGeneral';
import {
  Department,
  Municipality
} from '../../../shared/interfaces/location.interface';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { NormalizeNameDirective } from '../../../shared/directives/normalize-name.directive';
import { NoSpacesDirective } from '../../../shared/directives/no-spaces.directive';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';

@Component({
  selector: 'app-create-or-edit-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    NgFor,
    MatButtonModule,
    FontAwesomeModule,
    MatIcon,
    BasePageComponent,
    LoaderComponent,
    NormalizeNameDirective,
    NoSpacesDirective,
    RouterLink,
    TranslateModule,
    MatTooltipModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './create-or-edit-users.component.html',
  styleUrl: './create-or-edit-users.component.scss'
})
export class CreateOrEditUsersComponent implements OnInit {
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _locationService: LocationService = inject(LocationService);

  // Códigos de documento colombianos: solo para estos aplica la ubicación DANE
  // (departamento/municipio). Para extranjeros (CE, PAS) queda vacío.
  private readonly COLOMBIAN_DOC_CODES = ['CC', 'NIT', 'TI', 'RC'];

  userForm: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  userId: string = '';
  identificationType: IdentificationType[] = [];
  roleType: RoleType[] = [];
  personType: PersonType[] = [];
  phoneCode: PhoneCode[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  departments: Department[] = [];
  municipalities: Municipality[] = [];
  private allMunicipalities: Municipality[] = [];
  isEditMode: boolean = false;
  loading: boolean = false;
  loadingPhoneCodes: boolean = false;
  isSaving: boolean = false;
  userLogged?: UserInterface;

  /**
   * Cuando el documento es NIT exige el formato "número-dv" (ej. 900123456-7) y
   * que el dígito de verificación coincida con el calculado (algoritmo DIAN).
   * Para otros documentos no aplica. Expone el dv esperado en el error para
   * mostrarle al usuario cuál le falta o cuál debería ser.
   */
  private nitValidator = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value || !this.isNitSelected()) return null;

    const match = value.match(/^(\d+)-(\d)$/);
    if (!match) {
      const numberPart = value.replace(/\D/g, '');
      return {
        nitMissingDv: { dv: numberPart ? this.computeNitDv(numberPart) : '' }
      };
    }
    const [, numberPart, dv] = match;
    const expected = this.computeNitDv(numberPart);
    return dv === expected ? null : { nitWrongDv: { dv: expected } };
  };

  constructor(private _fb: FormBuilder) {
    this.userForm = this._fb.group({
      roleTypeId: ['', Validators.required],
      identificationTypeId: ['', [Validators.required]],
      identificationNumber: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]
      ],
      firstName: [
        '',
        [Validators.required, Validators.pattern(/^\S.*\S$|^\S$/)]
      ],
      lastName: [
        '',
        [Validators.required, Validators.pattern(/^\S.*\S$|^\S$/)]
      ],
      email: ['', [Validators.email, Validators.pattern(/^\S+$/)]],
      phoneCodeId: ['', Validators.required],
      phoneCodeSearch: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      isActive: [true, Validators.required],
      personTypeId: [{ value: '', disabled: true }],
      address: [''],
      departmentId: [''],
      municipalityId: ['']
    });
  }
  ngOnInit(): void {
    this.userLogged = this._authService.getUserLoggedIn();
    this.getRelatedData();
    this.loadLocationCatalogs();
    this.setupPhoneCodeSearch();
    this.setupDepartmentListener();
    this.setupIdentificationTypeListener();
    this.userForm
      .get('identificationNumber')
      ?.addValidators(this.nitValidator);
    this.userId = this._activatedRoute.snapshot.params['id'];
    this.isEditMode = !!this.userId;
    if (this.isEditMode) {
      this.getUserToEdit(this.userId);
    }
  }
  getRelatedData(): void {
    this.loading = true;
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        const allRoles = res.data?.roleType || [];
        const roleCode = this.userLogged?.roleType?.code || '';

        if (roleCode === 'EMP') {
          const allowedCodes = ['CHE', 'MES', 'USER', 'EMP', 'PRO'];
          this.roleType = allRoles.filter((r) =>
            allowedCodes.includes(r.code?.trim() || '')
          );
        } else {
          this.roleType = allRoles;
        }

        this.identificationType = res.data?.identificationType || [];
        this.personType = res.data?.personType || [];
        this.phoneCode = res.data?.phoneCode || [];
        this.filteredPhoneCodes = this.phoneCode.slice(0, 20);
        // Ya se conoce el tipo de documento (incl. modo edición): aplica la
        // obligatoriedad de depto/municipio según sea cliente de Colombia.
        this.updateLocationValidators();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos relacionados:', error);
        this.loading = false;
      }
    });
  }
  setupPhoneCodeSearch(): void {
    this.userForm
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
  displayPhoneCode(phoneCode: PhoneCode): string {
    // Se usa como [displayWith] (sin contexto `this`), por eso instanciamos el
    // pipe en vez de inyectarlo. Normaliza el nombre del país (p. ej. "COLOMBIA"
    // → "Colombia") igual que las opciones del desplegable.
    return phoneCode
      ? `${phoneCode.code} ${new CapitalizePipe().transform(phoneCode.name)}`
      : '';
  }
  get isPhoneCodeSelected(): boolean {
    const val = this.userForm.get('phoneCodeSearch')?.value;
    return typeof val === 'object' && val !== null;
  }

  onPhoneCodeSelected(phoneCode: PhoneCode): void {
    if (phoneCode && phoneCode.phoneCodeId) {
      this.userForm.patchValue({
        phoneCodeId: phoneCode.phoneCodeId.toString()
      });
      this.userForm.get('phoneCodeSearch')?.setErrors(null);
    }
  }

  clearPhoneCodeSelection(): void {
    this.userForm.patchValue({ phoneCodeId: '', phoneCodeSearch: '' });
    this.userForm.get('phoneCodeSearch')?.setErrors(null);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\s/g, '');
    this.userForm.get('phone')?.setValue(cleaned, { emitEvent: false });
  }
  setPassword() {
    const identificationValue = this.userForm.get(
      'identificationNumber'
    )?.value;
    if (identificationValue) {
      this.userForm.patchValue({
        password: identificationValue,
        confirmPassword: identificationValue
      });
    }
  }
  private setupIdentificationTypeListener(): void {
    this.userForm
      .get('identificationTypeId')
      ?.valueChanges.subscribe((selectedId: string) => {
        this.applyPersonTypeLock(selectedId);
        // El NIT exige dv: revalida el número al cambiar el tipo de documento.
        this.userForm.get('identificationNumber')?.updateValueAndValidity();
        // Documento extranjero: la ubicación DANE no aplica, se limpia.
        if (!this.showLocation) {
          this.userForm
            .get('departmentId')
            ?.setValue('', { emitEvent: false });
          this.userForm
            .get('municipalityId')
            ?.setValue('', { emitEvent: false });
          this.municipalities = [];
        }
        // Obligatorios solo si el cliente es de Colombia.
        this.updateLocationValidators();
      });
  }

  /**
   * Departamento y municipio son obligatorios SOLO para clientes de Colombia
   * (cuando los selects se muestran). Para extranjeros no llevan validadores.
   */
  private updateLocationValidators(): void {
    const required = this.showLocation;
    const apply = (control: AbstractControl | null) => {
      if (required) control?.setValidators([Validators.required]);
      else control?.clearValidators();
      control?.updateValueAndValidity({ emitEvent: false });
    };
    apply(this.userForm.get('departmentId'));
    apply(this.userForm.get('municipalityId'));
  }

  /** Carga departamentos y municipios (cacheados en el servicio). */
  private loadLocationCatalogs(): void {
    this._locationService.getDepartments().subscribe({
      next: (departments) => (this.departments = departments),
      error: (e) => console.error('Error al cargar departamentos:', e)
    });
    this._locationService.getAllMunicipalities().subscribe({
      next: (municipalities) => {
        this.allMunicipalities = municipalities;
        // En modo edición el departamento ya puede estar elegido: refiltra.
        const deptId = this.userForm.get('departmentId')?.value;
        if (deptId) this.filterMunicipalities(+deptId);
      },
      error: (e) => console.error('Error al cargar municipios:', e)
    });
  }

  /** Al cambiar el departamento se limpia el municipio y se refiltra la lista. */
  private setupDepartmentListener(): void {
    this.userForm.get('departmentId')?.valueChanges.subscribe((deptId) => {
      this.userForm.get('municipalityId')?.setValue('', { emitEvent: false });
      this.filterMunicipalities(deptId ? +deptId : null);
    });
  }

  private filterMunicipalities(departmentId: number | null): void {
    this.municipalities = departmentId
      ? this.allMunicipalities.filter((m) => m.departmentId === departmentId)
      : [];
  }

  /** Código del tipo de documento seleccionado (CC, NIT, CE, PAS, ...). */
  get selectedDocCode(): string {
    const id = this.userForm?.get('identificationTypeId')?.value;
    return (
      this.identificationType.find(
        (t) => t.identificationTypeId?.toString() === id
      )?.code ?? ''
    );
  }

  /** La ubicación DANE (depto/municipio) solo aplica a documentos colombianos. */
  get showLocation(): boolean {
    return this.COLOMBIAN_DOC_CODES.includes(this.selectedDocCode);
  }

  private isNitSelected(): boolean {
    const id = this.userForm?.get('identificationTypeId')?.value;
    const selected = this.identificationType.find(
      (t) => t.identificationTypeId?.toString() === id
    );
    return !!selected?.name?.['es']?.toUpperCase().includes('NIT');
  }

  /** Dígito de verificación de un NIT según el algoritmo oficial de la DIAN. */
  private computeNitDv(nit: string): string {
    const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const digits = nit.replace(/\D/g, '');
    const reversed = digits.split('').reverse();
    let sum = 0;
    for (let i = 0; i < reversed.length && i < weights.length; i++) {
      sum += parseInt(reversed[i], 10) * weights[i];
    }
    const mod = sum % 11;
    const dv = mod > 1 ? 11 - mod : mod;
    return String(dv);
  }
  private applyPersonTypeLock(identificationTypeId: string): void {
    const selectedType = this.identificationType.find(
      (t) => t.identificationTypeId?.toString() === identificationTypeId
    );
    if (!selectedType) return;
    const isNit = selectedType?.name?.['es']?.toUpperCase().includes('NIT');
    if (isNit) {
      const juridica = this.personType.find(
        (pt) =>
          pt.name?.['es']?.toUpperCase().includes('JUR\u00CDDICA') ||
          pt.name?.['es']?.toUpperCase().includes('JURIDICA')
      );
      if (juridica) {
        this.userForm.patchValue(
          { personTypeId: juridica.personTypeId.toString() },
          { emitEvent: false }
        );
      }
    } else {
      const natural = this.personType.find((pt) =>
        pt.name?.['es']?.toUpperCase().includes('NATURAL')
      );
      if (natural) {
        this.userForm.patchValue(
          { personTypeId: natural.personTypeId.toString() },
          { emitEvent: false }
        );
      }
    }
  }
  private getUserToEdit(userId: string): void {
    this.loading = true;
    this._usersService.getUserEditPanel(userId).subscribe({
      next: (res) => {
        const user = res.data;
        this.userForm.patchValue({
          userId: user.userId,
          roleTypeId: user.roleType?.roleTypeId,
          identificationTypeId:
            user.identificationType?.identificationTypeId.toString(),
          identificationNumber: user.identificationNumber?.replace(/\s/g, '') ?? '',
          firstName: user.firstName?.replace(/\s+/g, ' ').trim() ?? '',
          lastName: user.lastName?.replace(/\s+/g, ' ').trim() ?? '',
          email: user.email?.replace(/\s/g, '').toLowerCase() ?? '',
          phoneCodeId: user.phoneCode?.phoneCodeId.toString(),
          phoneCodeSearch: user.phoneCode,
          phone: user.phone?.replace(/\s/g, '') ?? '',
          isActive: user.isActive,
          personTypeId: user.personType?.personTypeId?.toString() || '',
          address: user.address ?? ''
        });

        // Ubicación DANE (sin disparar el listener para no borrar el municipio).
        const deptId = user.department?.departmentId ?? null;
        const muniId = user.municipality?.municipalityId ?? null;
        this.userForm
          .get('departmentId')
          ?.setValue(deptId ?? '', { emitEvent: false });
        this.filterMunicipalities(deptId);
        this.userForm
          .get('municipalityId')
          ?.setValue(muniId ?? '', { emitEvent: false });

        if (this.userLogged?.userId === user.userId) {
          this.userForm.get('roleTypeId')?.disable();
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err.error?.message || err);
      }
    });
  }
  save() {
    if (this.userForm.get('identificationNumber')?.value) {
      this.setPassword();
    }
    if (this.userForm.valid) {
      const formValue = this.userForm.getRawValue();
      // La ubicación solo se envía para clientes de Colombia; para extranjeros
      // va en null para que el backend la limpie (y use el municipio del negocio).
      const isColombian = this.showLocation;
      const userSave: CreateUserPanel = {
        userId: this.isEditMode ? this.userId : uuid.v4(),
        roleType: formValue.roleTypeId,
        identificationType: formValue.identificationTypeId,
        identificationNumber: formValue.identificationNumber,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email || undefined,
        phoneCode: formValue.phoneCodeId,
        phone: formValue.phone,
        password: formValue.identificationNumber,
        confirmPassword: formValue.identificationNumber,
        isActive: formValue.isActive,
        personType: formValue.personTypeId || undefined,
        address: formValue.address?.trim() || undefined,
        departmentId:
          isColombian && formValue.departmentId
            ? +formValue.departmentId
            : null,
        municipalityId:
          isColombian && formValue.municipalityId
            ? +formValue.municipalityId
            : null
      };
      if (this.userId) {
        if (this.userForm.invalid) return;
        delete userSave.userId;
        delete userSave.password;
        delete userSave.confirmPassword;
        this.isSaving = true;
        this._usersService.updateUser(this.userId, userSave).subscribe({
          next: () => {
            this.isSaving = false;
            this._router.navigateByUrl('/organizational/users/list');
          },
          error: (error) => {
            this.isSaving = false;
            console.error('Error al actualizar el usuario', error);
          }
        });
      } else {
        this.isSaving = true;
        this._usersService.createUser(userSave).subscribe({
          next: () => {
            this.isSaving = false;
            this._router.navigateByUrl('/organizational/users/list');
          },
          error: (err) => {
            this.isSaving = false;
            if (err.error && err.error.message) {
              console.error('Error al registrar usuario:', err.error.message);
            } else {
              console.error('Error desconocido:', err);
            }
          }
        });
      }
    } else {
      if (!this.userForm.get('phoneCodeId')?.value) {
        this.userForm.get('phoneCodeSearch')?.setErrors({ required: true });
      }
      this.userForm.markAllAsTouched();
    }
  }
  onEmailInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.userForm
      .get('email')
      ?.setValue(input.value.toLowerCase().replace(/\s/g, ''), { emitEvent: false });
  }
}
