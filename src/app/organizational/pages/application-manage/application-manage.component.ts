import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { OrganizationalGeneralInfoComponent } from '../../components/organizational-general-info/organizational-general-info.component';
import { OrganizationalAppearanceComponent } from '../../components/organizational-appearance/organizational-appearance.component';
import { OrganizationalWebContentComponent } from '../../components/organizational-web-content/organizational-web-content.component';
import { OrganizationalHomeContentComponent } from '../../components/organizational-home-content/organizational-home-content.component';
import { OrganizationalMultimediaComponent } from '../../components/organizational-multimedia/organizational-multimedia.component';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  Organizational,
  OrganizationalMedia,
  MediaType,
  CorporateValue
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
    MatTabsModule,
    BasePageComponent,
    LoaderComponent,
    OrganizationalGeneralInfoComponent,
    OrganizationalAppearanceComponent,
    OrganizationalWebContentComponent,
    OrganizationalHomeContentComponent,
    OrganizationalMultimediaComponent
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

  form: FormGroup;
  isLoading: boolean = true;
  mediaMap: Record<string, OrganizationalMedia | OrganizationalMedia[]> = {};
  mediaTypes: MediaType[] = [];
  organizationalId: string | null = null;
  organization?: Organizational;
  corporateValues: CorporateValue[] = [];
  editingValue: CorporateValue | null = null;
  corporateValueForm: FormGroup;
  corporateValueImageLoading: Record<string, boolean> = {};
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
      tertiaryColor: [''],
      homeTitle: [''],
      homeDescription: [''],
      experienceTitle: [''],
      experienceDescription: [''],
      reservationTitle: [''],
      reservationDescription: [''],
      aboutUsTitle: [''],
      aboutUsDescription: [''],
      missionTitle: [''],
      missionDescription: [''],
      visionTitle: [''],
      visionDescription: [''],
      historyTitle: [''],
      historyDescription: [''],
      gastronomyTitle: [''],
      gastronomyDescription: [''],
      gastronomyHistoryTitle: [''],
      gastronomyHistoryDescription: [''],
      gastronomyKitchenTitle: [''],
      gastronomyKitchenDescription: [''],
      gastronomyIngredientsTitle: [''],
      gastronomyIngredientsDescription: [''],
      accommodationsTitle: [''],
      accommodationsDescription: [''],
      howToArrivePublicTransportDescription: [''],
      howToArrivePrivateTransportDescription: [''],
      accessibilityDescription: [''],
      mapsUrl: [''],
      videoUrl: [''],
      metaTitle: [''],
      metaDescription: ['']
    });

    this.corporateValueForm = this._fb.group({
      title: ['', Validators.required],
      description: [''],
      order: [0]
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
      this.loadOrganization();
      this._applicationService.loadMedia(id);
      this.loadCorporateValues(id);
    } else {
      this.isLoading = false;
    }
  }

  private subscribeToMedia(): void {
    this._subscription.add(
      this._applicationService.mediaMap$.subscribe((media) => {
        if (media) this.mediaMap = media;
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
      if (this.organization.tertiaryColor) {
        document.documentElement.style.setProperty(
          '--tertiary-color',
          this.organization.tertiaryColor
        );
      }
    }
  }

  private setupLiveColorPreview(): void {
    this._subscription.add(
      this.form.get('primaryColor')?.valueChanges.subscribe((color) => {
        if (color)
          document.documentElement.style.setProperty('--primary-color', color);
      })
    );
    this._subscription.add(
      this.form.get('secondaryColor')?.valueChanges.subscribe((color) => {
        if (color)
          document.documentElement.style.setProperty(
            '--secondary-color',
            color
          );
      })
    );
    this._subscription.add(
      this.form.get('tertiaryColor')?.valueChanges.subscribe((color) => {
        if (color)
          document.documentElement.style.setProperty('--tertiary-color', color);
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

  private loadOrganization(): void {
    this.isLoading = true;
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        this.identificationTypes = res.data.identificationType;
        const org = res.data.organizational?.[0];
        if (org) {
          this.organization = org;
          this.patchForm(org);
        }
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
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
      tertiaryColor: org.tertiaryColor,
      homeTitle: org.homeTitle,
      homeDescription: org.homeDescription,
      experienceTitle: org.experienceTitle,
      experienceDescription: org.experienceDescription,
      reservationTitle: org.reservationTitle,
      reservationDescription: org.reservationDescription,
      aboutUsTitle: org.aboutUsTitle,
      aboutUsDescription: org.aboutUsDescription,
      missionTitle: org.missionTitle,
      missionDescription: org.missionDescription,
      visionTitle: org.visionTitle,
      visionDescription: org.visionDescription,
      historyTitle: org.historyTitle,
      historyDescription: org.historyDescription,
      gastronomyTitle: org.gastronomyTitle,
      gastronomyDescription: org.gastronomyDescription,
      gastronomyHistoryTitle: org.gastronomyHistoryTitle,
      gastronomyHistoryDescription: org.gastronomyHistoryDescription,
      gastronomyKitchenTitle: org.gastronomyKitchenTitle,
      gastronomyKitchenDescription: org.gastronomyKitchenDescription,
      gastronomyIngredientsTitle: org.gastronomyIngredientsTitle,
      gastronomyIngredientsDescription: org.gastronomyIngredientsDescription,
      accommodationsTitle: org.accommodationsTitle,
      accommodationsDescription: org.accommodationsDescription,
      howToArrivePublicTransportDescription:
        org.howToArrivePublicTransportDescription,
      howToArrivePrivateTransportDescription:
        org.howToArrivePrivateTransportDescription,
      accessibilityDescription: org.accessibilityDescription,
      mapsUrl: org.mapsUrl,
      videoUrl: org.videoUrl,
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
    const {
      identificationTypeId,
      phoneCodeId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      phoneCodeSearch: _phoneCodeSearch,
      ...rest
    } = rawValue;
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
            if (payload.primaryColor)
              this.organization.primaryColor = payload.primaryColor;
            if (payload.secondaryColor)
              this.organization.secondaryColor = payload.secondaryColor;
            if (payload.tertiaryColor)
              this.organization.tertiaryColor = payload.tertiaryColor;
          }
          this.isLoading = false;
        },
        error: () => (this.isLoading = false)
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
        error: () => {
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
      error: () => {
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
      this.form.patchValue({ phoneCodeId: phoneCode.phoneCodeId });
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
          this.mediaLoading[mediaTypeCode] = false;
        },
        error: () => (this.mediaLoading[mediaTypeCode] = false)
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
          this.mediaLoading[mediaTypeCode] = false;
        },
        error: () => (this.mediaLoading[mediaTypeCode] = false)
      });
  }

  previewMedia(mediaTypeCode: string): void {
    const url = this.getMediaUrl(mediaTypeCode);
    if (url) window.open(url, '_blank');
  }

  getMediaUrl(code: string): string | null {
    const media = this.mediaMap[code];
    if (!media) return null;
    return Array.isArray(media) ? media[0]?.url : media.url;
  }

  loadCorporateValues(id: string): void {
    this._applicationService.getCorporateValues(id).subscribe({
      next: (res) => (this.corporateValues = res.data)
    });
  }

  startEditValue(value: CorporateValue): void {
    this.editingValue = value;
    this.corporateValueForm.patchValue({
      title: value.title,
      description: value.description,
      order: value.order
    });
  }

  cancelEditValue(): void {
    this.editingValue = null;
    this.corporateValueForm.reset({ order: 0 });
  }

  saveCorporateValue(): void {
    if (this.corporateValueForm.invalid || !this.organizationalId) return;
    const data = this.corporateValueForm.getRawValue();

    if (this.editingValue) {
      this._applicationService
        .updateCorporateValue(this.editingValue.corporateValueId, data)
        .subscribe({
          next: () => {
            this.loadCorporateValues(this.organizationalId!);
            this.cancelEditValue();
          }
        });
    } else {
      this._applicationService
        .createCorporateValue(this.organizationalId, data)
        .subscribe({
          next: () => {
            this.loadCorporateValues(this.organizationalId!);
            this.cancelEditValue();
          }
        });
    }
  }

  deleteCorporateValue(valueId: string): void {
    if (!confirm('¿Eliminar este valor corporativo?')) return;
    this._applicationService.deleteCorporateValue(valueId).subscribe({
      next: () => this.loadCorporateValues(this.organizationalId!)
    });
  }

  uploadCorporateValueImage(event: { valueId: string; file: File }): void {
    this.corporateValueImageLoading[event.valueId] = true;
    this._applicationService.uploadCorporateValueImage(event.valueId, event.file).subscribe({
      next: () => {
        this.loadCorporateValues(this.organizationalId!);
        this.corporateValueImageLoading[event.valueId] = false;
      },
      error: () => {
        this.corporateValueImageLoading[event.valueId] = false;
      }
    });
  }

  deleteCorporateValueImage(valueId: string): void {
    if (!confirm('¿Eliminar la imagen de este valor corporativo?')) return;
    this._applicationService.deleteCorporateValueImage(valueId).subscribe({
      next: () => this.loadCorporateValues(this.organizationalId!)
    });
  }
}
