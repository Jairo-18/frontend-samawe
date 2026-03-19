import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import {
  Organizational,
  OrganizationalMedia,
  MediaType
} from '../../../shared/interfaces/organizational.interface';
import {
  IdentificationType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import {
  Subscription,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of
} from 'rxjs';

@Component({
  selector: 'app-application-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    BasePageComponent,
    LoaderComponent
  ],
  templateUrl: './application-manage.component.html',
  styleUrls: ['./application-manage.component.scss']
})
export class ApplicationManageComponent implements OnInit, OnDestroy {
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _snackBar: MatSnackBar = inject(MatSnackBar);

  form: FormGroup;
  isLoading: boolean = true;
  mediaMap: Record<string, OrganizationalMedia | OrganizationalMedia[]> = {};
  mediaTypes: MediaType[] = [];
  organizationalId: string | null = null;
  organization?: Organizational;
  private _subscription: Subscription = new Subscription();

  identificationTypes: IdentificationType[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  loadingPhoneCodes: boolean = false;

  mediaLoading: Record<string, boolean> = {
    LOGO: false,
    LOGIN_BG: false,
    REGISTER_BG: false
  };

  constructor() {
    this.form = this._fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      legalName: [''],
      identificationNumber: [''],
      identificationTypeId: [null],
      email: ['', [Validators.email]],
      phone: [''],
      phoneCodeId: [null],
      phoneCodeSearch: [''],
      website: [''],
      address: [''],
      city: [''],
      department: [''],
      description: [''],
      primaryColor: [''],
      secondaryColor: [''],
      metaTitle: [''],
      metaDescription: ['']
    });
  }

  ngOnInit(): void {
    this.setupPhoneCodeSearch();
    this.setupLiveColorPreview();
    this.loadMediaTypes();
    this.subscribeToMedia();
    const id = this._authService.getOrganizationalId();
    this.organizationalId = id;
    if (id) {
      this.loadOrganization(id);
      this._applicationService.loadMedia(id);
    } else {
      this._snackBar.open('No se pudo identificar la organización.', 'Cerrar', {
        duration: 3000
      });
      this.isLoading = false;
    }
  }

  private subscribeToMedia(): void {
    this._subscription.add(
      this._applicationService.mediaMap$.subscribe((media) => {
        if (media) {
          this.mediaMap = media;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();

    if (this.organization) {
      if (this.organization.primaryColor) {
        document.documentElement.style.setProperty(
          '--primary-color',
          this.organization.primaryColor
        );
      }
      if (this.organization.secondaryColor) {
        document.documentElement.style.setProperty(
          '--secondary-color',
          this.organization.secondaryColor
        );
      }
    }
  }

  private setupLiveColorPreview(): void {
    this._subscription.add(
      this.form.get('primaryColor')?.valueChanges.subscribe((color) => {
        if (color) {
          document.documentElement.style.setProperty('--primary-color', color);
        }
      })
    );
    this._subscription.add(
      this.form.get('secondaryColor')?.valueChanges.subscribe((color) => {
        if (color) {
          document.documentElement.style.setProperty(
            '--secondary-color',
            color
          );
        }
      })
    );
  }

  private loadMediaTypes(): void {
    this._applicationService.getMediaTypes().subscribe({
      next: (res) => (this.mediaTypes = res.data)
    });
  }

  private loadMedia(id: string): void {
    this._applicationService.loadMedia(id);
  }

  private loadOrganization(id: string): void {
    this.isLoading = true;

    this._relatedDataService.getRelatedData().subscribe((res) => {
      this.identificationTypes = res.data.identificationType;
    });

    this._applicationService.getOrganization(id).subscribe({
      next: (res) => {
        this.organization = res.data;
        this.patchForm(res.data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading organization:', err);
        this._snackBar.open('Error al cargar la información.', 'Cerrar', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  private patchForm(org: Organizational): void {
    this.form.patchValue({
      name: org.name,
      slug: org.slug,
      legalName: org.legalName,
      identificationNumber: org.identificationNumber,
      identificationTypeId: org.identificationType?.identificationTypeId,
      email: org.email,
      phone: org.phone,
      phoneCodeId: org.phoneCode?.phoneCodeId,
      phoneCodeSearch: org.phoneCode,
      website: org.website,
      address: org.address,
      city: org.city,
      department: org.department,
      description: org.description,
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
      metaTitle: org.metaTitle,
      metaDescription: org.metaDescription
    });
  }

  save(): void {
    if (this.form.invalid || !this.organizationalId) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const rawValue = this.form.getRawValue();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { identificationTypeId, phoneCodeId, phoneCodeSearch: _phoneCodeSearch, ...rest } =
      rawValue;
    const payload: Partial<Organizational> & {
      identificationType?: string;
      phoneCode?: string;
    } = {
      ...rest,
      identificationType: identificationTypeId,
      phoneCode: phoneCodeId
    };

    this._applicationService
      .updateOrganization(this.organizationalId, payload)
      .subscribe({
        next: () => {
          if (this.organization) {
            if (payload.primaryColor) this.organization.primaryColor = payload.primaryColor;
            if (payload.secondaryColor) this.organization.secondaryColor = payload.secondaryColor;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error updating organization:', err);
          this.isLoading = false;
        }
      });
  }

  setupPhoneCodeSearch(): void {
    this.loadPhoneCodes('');
    this.form
      .get('phoneCodeSearch')
      ?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((searchTerm: string) => {
          if (typeof searchTerm !== 'string') {
            return of({ data: this.filteredPhoneCodes, meta: {} });
          }
          this.loadingPhoneCodes = true;
          return this._relatedDataService.searchPhoneCodes(searchTerm, 1, 20);
        })
      )
      .subscribe({
        next: (response) => {
          this.filteredPhoneCodes = response.data || [];
          this.loadingPhoneCodes = false;
        },
        error: (error) => {
          console.error('Error buscando códigos de país:', error);
          this.filteredPhoneCodes = [];
          this.loadingPhoneCodes = false;
        }
      });
  }

  loadPhoneCodes(search: string = ''): void {
    this.loadingPhoneCodes = true;
    this._relatedDataService.searchPhoneCodes(search, 1, 20).subscribe({
      next: (response) => {
        this.filteredPhoneCodes = response.data || [];
        this.loadingPhoneCodes = false;
      },
      error: (error) => {
        console.error('Error cargando códigos de país:', error);
        this.filteredPhoneCodes = [];
        this.loadingPhoneCodes = false;
      }
    });
  }

  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode ? `${phoneCode.name} ${phoneCode.code}` : '';
  }

  onPhoneCodeSelected(phoneCode: PhoneCode): void {
    if (phoneCode && phoneCode.phoneCodeId) {
      this.form.patchValue({
        phoneCodeId: phoneCode.phoneCodeId
      });
    }
  }

  onFileSelected(event: Event, mediaTypeCode: string): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || !this.organizationalId) return;

    const type = this.mediaTypes.find((t) => t.code === mediaTypeCode);
    if (!type) return;

    this.mediaLoading[mediaTypeCode] = true;
    this._applicationService
      .uploadFile(this.organizationalId, type.mediaTypeId, file)
      .subscribe({
        next: () => {
          this.loadMedia(this.organizationalId!);
          this._snackBar.open('Imagen subida correctamente.', 'Cerrar', {
            duration: 3000
          });
          this.mediaLoading[mediaTypeCode] = false;
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this._snackBar.open('Error al subir la imagen.', 'Cerrar', {
            duration: 3000
          });
          this.mediaLoading[mediaTypeCode] = false;
        }
      });
  }

  deleteMedia(mediaTypeCode: string): void {
    const media = this.mediaMap[mediaTypeCode];
    if (!media || !this.organizationalId) return;

    const mediaItem = Array.isArray(media) ? media[0] : media;
    if (!mediaItem.organizationalMediaId) return;

    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

    this.mediaLoading[mediaTypeCode] = true;
    this._applicationService
      .deleteMedia(mediaItem.organizationalMediaId)
      .subscribe({
        next: () => {
          this.loadMedia(this.organizationalId!);
          this._snackBar.open('Imagen eliminada correctamente.', 'Cerrar', {
            duration: 3000
          });
          this.mediaLoading[mediaTypeCode] = false;
        },
        error: (err) => {
          console.error('Error deleting media:', err);
          this._snackBar.open('Error al eliminar la imagen.', 'Cerrar', {
            duration: 3000
          });
          this.mediaLoading[mediaTypeCode] = false;
        }
      });
  }

  previewMedia(mediaTypeCode: string): void {
    const url = this.getMediaUrl(mediaTypeCode);
    if (url) {
      window.open(url, '_blank');
    }
  }

  getMediaUrl(code: string): string | null {
    const media = this.mediaMap[code];
    if (!media) return null;
    return Array.isArray(media) ? media[0]?.url : media.url;
  }
}
