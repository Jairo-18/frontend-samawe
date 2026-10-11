import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import {
  PlatformOrganization,
  SaveOrganization
} from '../../../shared/interfaces/organizational.interface';
import {
  IdentificationType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import { OrganizationsService } from '../../services/organizations.service';
import { NotificationsService } from '../../../shared/services/notifications.service';

/** Mismo formato que valida el backend y que usa la URL pública del hotel. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Eco Hotel Samawé" → "eco-hotel-samawe". */
export function slugify(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

@Component({
  selector: 'app-create-or-edit-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIcon,
    TranslateModule,
    SectionHeaderComponent,
    TranslatedPipe
  ],
  templateUrl: './create-or-edit-organization.component.html'
})
export class CreateOrEditOrganizationComponent implements OnChanges {
  @Input() currentOrganization?: PlatformOrganization;
  @Input() identificationTypes: IdentificationType[] = [];
  @Input() phoneCodes: PhoneCode[] = [];
  /**
   * Organizaciones que esta sesión está usando (la propia y la abierta con
   * "Entrar"): no se pueden desactivar desde aquí.
   */
  @Input() inUseIds: string[] = [];
  @Output() organizationSaved = new EventEmitter<void>();
  @Output() organizationCanceled = new EventEmitter<void>();

  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _organizationsService: OrganizationsService =
    inject(OrganizationsService);
  private readonly _notificationsService: NotificationsService =
    inject(NotificationsService);

  form: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    legalName: ['', [Validators.maxLength(150)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(SLUG_PATTERN)
      ]
    ],
    identificationType: [null],
    identificationNumber: ['', [Validators.maxLength(50)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    phoneCode: [null],
    phone: ['', [Validators.maxLength(25)]],
    address: ['', [Validators.maxLength(200)]],
    city: ['', [Validators.maxLength(100)]],
    department: ['', [Validators.maxLength(100)]],
    website: ['', [Validators.maxLength(200)]],
    status: [true, Validators.required]
  });
  isEditMode = false;
  isSaving = false;
  /** Mientras el usuario no toque el slug, se arma solo a partir del nombre. */
  private _slugTouchedByUser = false;

  constructor() {
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isEditMode && !this._slugTouchedByUser) {
        this.form.get('slug')?.setValue(slugify(name), { emitEvent: false });
      }
    });
  }

  /** ¿Es la organización del sitio en el que estoy conectado? */
  get isCurrentTenant(): boolean {
    return (
      !!this.currentOrganization &&
      this.inUseIds.includes(this.currentOrganization.organizationalId)
    );
  }

  get canSave(): boolean {
    return !this.isSaving && this.form.dirty;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['currentOrganization'] && !changes['inUseIds']) return;
    const org = this.currentOrganization;
    if (!org) {
      if (changes['currentOrganization']) this._resetToCreate();
      return;
    }
    this.isEditMode = true;
    this._slugTouchedByUser = true;
    this.form.reset({
      name: org.name ?? '',
      legalName: org.legalName ?? '',
      slug: org.slug ?? '',
      identificationType: org.identificationType?.identificationTypeId ?? null,
      identificationNumber: org.identificationNumber ?? '',
      email: org.email ?? '',
      phoneCode: org.phoneCode?.phoneCodeId ?? null,
      phone: org.phone ?? '',
      address: org.address ?? '',
      city: org.city ?? '',
      department: org.department ?? '',
      website: org.website ?? '',
      status: org.status ?? true
    });
    // El slug no se cambia al editar: el sitio carga su marca por slug y la
    // siembra de dominios lo usa para encontrar el hotel.
    this.form.get('slug')?.disable({ emitEvent: false });
    if (this.isCurrentTenant) {
      this.form.get('status')?.disable({ emitEvent: false });
    } else {
      this.form.get('status')?.enable({ emitEvent: false });
    }
  }

  onSlugInput(): void {
    this._slugTouchedByUser = true;
  }

  resetForm(): void {
    this._resetToCreate();
    this.organizationCanceled.emit();
  }

  private _resetToCreate(): void {
    this.isEditMode = false;
    this._slugTouchedByUser = false;
    this.form.reset({
      name: '',
      legalName: '',
      slug: '',
      identificationType: null,
      identificationNumber: '',
      email: '',
      phoneCode: null,
      phone: '',
      address: '',
      city: '',
      department: '',
      website: '',
      status: true
    });
    this.form.get('slug')?.enable({ emitEvent: false });
    this.form.get('status')?.enable({ emitEvent: false });
  }

  /** Vacíos como `undefined`: el backend valida formato (p. ej. email) si llega. */
  private _payload(): SaveOrganization {
    const v = this.form.getRawValue();
    const text = (x: string | null | undefined) => {
      const t = (x ?? '').trim();
      return t ? t : undefined;
    };
    return {
      name: v.name.trim(),
      legalName: text(v.legalName),
      slug: v.slug,
      identificationType: v.identificationType ?? undefined,
      identificationNumber: text(v.identificationNumber),
      email: text(v.email)?.toLowerCase(),
      phoneCode: v.phoneCode ?? undefined,
      phone: text(v.phone),
      address: text(v.address),
      city: text(v.city),
      department: text(v.department),
      website: text(v.website),
      status: !!v.status
    };
  }

  save(): void {
    if (this.form.invalid) {
      // Igual que en productos: el botón queda habilitado para que, al
      // pulsarlo, se marquen los campos que faltan.
      this.form.markAllAsTouched();
      this._notificationsService.showNotification(
        'error',
        'organizational.organizations.form.incomplete'
      );
      return;
    }
    this.isSaving = true;
    const payload = this._payload();
    const request$: Observable<unknown> =
      this.isEditMode && this.currentOrganization
        ? this._organizationsService.update(
            this.currentOrganization.organizationalId,
            payload
          )
        : this._organizationsService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this._resetToCreate();
        this.organizationSaved.emit();
      },
      // El interceptor ya muestra el mensaje del backend (slug repetido, etc.).
      error: () => {
        this.isSaving = false;
      }
    });
  }
}
