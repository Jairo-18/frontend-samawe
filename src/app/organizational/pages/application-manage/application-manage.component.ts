import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
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
import { OrganizationalMultimediaComponent } from '../../components/organizational-multimedia/organizational-multimedia.component';
import { OrganizationalHomeContentComponent } from '../../components/organizational-home-content/organizational-home-content.component';
import { OrganizationalLegalComponent } from '../../components/organizational-legal/organizational-legal.component';
import { OrganizationalGoogleBusinessComponent } from '../../components/organizational-google-business/organizational-google-business.component';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  Organizational,
  OrganizationalMedia,
  MediaType,
  CorporateValue,
  BenefitSection,
  LegalSection,
  LegalType
} from '../../../shared/interfaces/organizational.interface';
import {
  IdentificationType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import {
  forkJoin,
  Subscription,
  debounceTime,
  distinctUntilChanged
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
    OrganizationalMultimediaComponent,
    OrganizationalLegalComponent,
    OrganizationalGoogleBusinessComponent
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
  private readonly _dialog: MatDialog = inject(MatDialog);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);

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

  benefitSections: BenefitSection[] = [];
  editingSection: BenefitSection | null = null;
  benefitSectionForm: FormGroup;

  legalSections: LegalSection[] = [];
  googleBusinessSuccess: boolean = false;
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
      textColor: [''],
      titleColor: [''],
      subtitleColor: [''],
      bgPrimaryColor: [''],
      bgSecondaryColor: [''],
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
      howToArriveDescription: [''],
      howToArrivePublicTransportDescription: [''],
      howToArrivePrivateTransportDescription: [''],
      accessibilityDescription: [''],
      mapsUrl: [''],
      videoUrl: [''],
      facebookUrl: [''],
      instagramUrl: [''],
      metaTitle: [''],
      metaDescription: ['']
    });

    this.corporateValueForm = this._fb.group({
      title: ['', Validators.required],
      description: [''],
      order: [0]
    });

    this.benefitSectionForm = this._fb.group({
      title: ['', Validators.required],
      order: [0]
    });
  }

  ngOnInit(): void {
    this.setupLiveColorPreview();
    const id = this._authService.getOrganizationalId();
    this.organizationalId = id;
    if (id) {
      this.loadOrganization();
    } else {
      this.isLoading = false;
    }
    this._route.queryParams.subscribe((params) => {
      this.googleBusinessSuccess = params['googleBusiness'] === 'success';
    });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();

    if (this.organization && isPlatformBrowser(this._platformId)) {
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
      if (this.organization.textColor) {
        document.documentElement.style.setProperty(
          '--text',
          this.organization.textColor
        );
      }
      if (this.organization.titleColor) {
        document.documentElement.style.setProperty(
          '--title',
          this.organization.titleColor
        );
      }
      if (this.organization.subtitleColor) {
        document.documentElement.style.setProperty(
          '--subtitle',
          this.organization.subtitleColor
        );
      }
      if (this.organization.bgPrimaryColor) {
        document.documentElement.style.setProperty(
          '--bg-principal',
          this.organization.bgPrimaryColor
        );
      }
      if (this.organization.bgSecondaryColor) {
        document.documentElement.style.setProperty(
          '--bg-secondary',
          this.organization.bgSecondaryColor
        );
      }
    }
  }

  private setupLiveColorPreview(): void {
    if (!isPlatformBrowser(this._platformId)) return;

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
    this._subscription.add(
      this.form.get('textColor')?.valueChanges.subscribe((color) => {
        if (color) document.documentElement.style.setProperty('--text', color);
      })
    );
    this._subscription.add(
      this.form.get('titleColor')?.valueChanges.subscribe((color) => {
        if (color) document.documentElement.style.setProperty('--title', color);
      })
    );
    this._subscription.add(
      this.form.get('subtitleColor')?.valueChanges.subscribe((color) => {
        if (color)
          document.documentElement.style.setProperty('--subtitle', color);
      })
    );
    this._subscription.add(
      this.form.get('bgPrimaryColor')?.valueChanges.subscribe((color) => {
        if (color)
          document.documentElement.style.setProperty('--bg-principal', color);
      })
    );
    this._subscription.add(
      this.form.get('bgSecondaryColor')?.valueChanges.subscribe((color) => {
        if (color)
          document.documentElement.style.setProperty('--bg-secondary', color);
      })
    );
  }

  private reloadMedias(onLoaded?: () => void): void {
    if (!this.organizationalId) return;
    this._applicationService.getMedia(this.organizationalId).subscribe({
      next: (res) => {
        if (res.data) {
          this.buildMediaMapFromGrouped(res.data);
        }
        onLoaded?.();
      },
      error: () => onLoaded?.()
    });
  }

  private buildMediaMapFromGrouped(
    grouped: Record<string, OrganizationalMedia[]>
  ): void {
    const map: Record<string, OrganizationalMedia[]> = {};
    Object.entries(grouped).forEach(([code, items]) => {
      map[code] = items;
    });
    this.mediaMap = map;
  }

  private loadOrganization(): void {
    this.isLoading = true;
    const id = this.organizationalId!;

    forkJoin([
      this._relatedDataService.getRelatedData(),
      this._applicationService.getOrganization(id),
      this._applicationService.getLegalSections(id),
      this._applicationService.getBenefitSections(id),
      this._applicationService.getMedia(id)
    ]).subscribe({
      next: ([relatedData, orgRes, legalRes, benefitRes, mediaRes]) => {
        this.identificationTypes = relatedData.data.identificationType;
        this.filteredPhoneCodes = relatedData.data.phoneCode;
        this.mediaTypes = relatedData.data.mediaType ?? [];
        this.setupPhoneCodeSearch(relatedData.data.phoneCode);

        const org = orgRes.data;
        if (org) {
          this.organization = org;
          this.patchForm(org);
        }

        if (mediaRes.data) {
          this.buildMediaMapFromGrouped(mediaRes.data);
        }

        this.legalSections = legalRes.data ?? [];
        this.benefitSections = benefitRes.data ?? [];
        this.loadCorporateValues(id);
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
      textColor: org.textColor,
      titleColor: org.titleColor,
      subtitleColor: org.subtitleColor,
      bgPrimaryColor: org.bgPrimaryColor,
      bgSecondaryColor: org.bgSecondaryColor,
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
      howToArriveDescription: org.howToArriveDescription,
      howToArrivePublicTransportDescription:
        org.howToArrivePublicTransportDescription,
      howToArrivePrivateTransportDescription:
        org.howToArrivePrivateTransportDescription,
      accessibilityDescription: org.accessibilityDescription,
      mapsUrl: org.mapsUrl,
      videoUrl: org.videoUrl,
      facebookUrl: org.facebookUrl,
      instagramUrl: org.instagramUrl,
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

  setupPhoneCodeSearch(allPhoneCodes: PhoneCode[]): void {
    this._subscription.add(
      this.form
        .get('phoneCodeSearch')
        ?.valueChanges.pipe(debounceTime(200), distinctUntilChanged())
        .subscribe((searchTerm: string) => {
          if (typeof searchTerm !== 'string') return;
          const q = searchTerm.toLowerCase().trim();
          this.filteredPhoneCodes = q
            ? allPhoneCodes.filter(
                (p) =>
                  p.name.toLowerCase().includes(q) ||
                  p.code?.toLowerCase().includes(q)
              )
            : allPhoneCodes;
        })
    );
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
          this.reloadMedias(() => {
            this.mediaLoading[mediaTypeCode] = false;
          });
        },
        error: () => (this.mediaLoading[mediaTypeCode] = false)
      });
  }

  deleteMedia(mediaTypeCode: string): void {
    const media = this.mediaMap[mediaTypeCode];
    if (!media || !this.organizationalId) return;

    const mediaItem = Array.isArray(media) ? media[0] : media;
    if (!mediaItem.organizationalMediaId) return;

    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Eliminar imagen',
        message: '¿Estás seguro de que deseas eliminar esta imagen?'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.mediaLoading[mediaTypeCode] = true;
      this._applicationService
        .deleteMedia(mediaItem.organizationalMediaId)
        .subscribe({
          next: () => {
            this.reloadMedias(() => {
              this.mediaLoading[mediaTypeCode] = false;
            });
          },
          error: () => (this.mediaLoading[mediaTypeCode] = false)
        });
    });
  }

  previewMedia(mediaTypeCode: string): void {
    const url = this.getMediaUrl(mediaTypeCode);
    if (url && isPlatformBrowser(this._platformId)) window.open(url, '_blank');
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
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Eliminar valor corporativo',
        message: '¿Deseas eliminar este valor corporativo?'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteCorporateValue(valueId).subscribe({
        next: () => this.loadCorporateValues(this.organizationalId!)
      });
    });
  }

  uploadCorporateValueImage(event: { valueId: string; file: File }): void {
    this.corporateValueImageLoading[event.valueId] = true;
    this._applicationService
      .uploadCorporateValueImage(event.valueId, event.file)
      .subscribe({
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
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Eliminar imagen',
        message: '¿Deseas eliminar la imagen de este valor corporativo?'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteCorporateValueImage(valueId).subscribe({
        next: () => this.loadCorporateValues(this.organizationalId!)
      });
    });
  }

  loadBenefitSections(id: string): void {
    this._applicationService.getBenefitSections(id).subscribe({
      next: (res) => (this.benefitSections = res.data)
    });
  }

  saveBenefitSection(): void {
    if (this.benefitSectionForm.invalid || !this.organizationalId) return;
    const data = this.benefitSectionForm.getRawValue();

    if (this.editingSection) {
      this._applicationService
        .updateBenefitSection(this.editingSection.benefitSectionId, data)
        .subscribe({
          next: () => {
            this.loadBenefitSections(this.organizationalId!);
            this.cancelSectionEdit();
          }
        });
    } else {
      this._applicationService
        .createBenefitSection(this.organizationalId, data)
        .subscribe({
          next: () => {
            this.loadBenefitSections(this.organizationalId!);
            this.cancelSectionEdit();
          }
        });
    }
  }

  startEditSection(section: BenefitSection): void {
    this.editingSection = section;
    this.benefitSectionForm.patchValue({
      title: section.title,
      order: section.order
    });
  }

  cancelSectionEdit(): void {
    this.editingSection = null;
    this.benefitSectionForm.reset({ order: 0 });
  }

  deleteBenefitSection(sectionId: string): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Eliminar sección',
        message: '¿Deseas eliminar esta sección y todos sus items?'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteBenefitSection(sectionId).subscribe({
        next: () => this.loadBenefitSections(this.organizationalId!)
      });
    });
  }

  addBenefitItem(payload: {
    sectionId: string;
    name: string;
    icon: string;
  }): void {
    this._applicationService
      .addBenefitItem(payload.sectionId, {
        name: payload.name,
        icon: payload.icon
      })
      .subscribe({
        next: () => this.loadBenefitSections(this.organizationalId!)
      });
  }

  updateBenefitItem(payload: {
    itemId: string;
    name: string;
    icon: string;
  }): void {
    this._applicationService
      .updateBenefitItem(payload.itemId, {
        name: payload.name,
        icon: payload.icon
      })
      .subscribe({
        next: () => this.loadBenefitSections(this.organizationalId!)
      });
  }

  deleteBenefitItem(itemId: string): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: { title: 'Eliminar item', message: '¿Deseas eliminar este item?' }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteBenefitItem(itemId).subscribe({
        next: () => this.loadBenefitSections(this.organizationalId!)
      });
    });
  }

  loadLegalSections(): void {
    this._applicationService
      .getLegalSections(this.organizationalId!)
      .subscribe({
        next: (res) => (this.legalSections = res.data)
      });
  }

  createLegalSection(type: LegalType): void {
    if (!this.organizationalId) return;
    this._applicationService
      .createLegalSection(this.organizationalId, { type })
      .subscribe({
        next: () => this.loadLegalSections()
      });
  }

  deleteLegalSection(sectionId: string): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Eliminar sección',
        message: '¿Deseas eliminar esta sección y todos sus items?'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteLegalSection(sectionId).subscribe({
        next: () => this.loadLegalSections()
      });
    });
  }

  addLegalItem(payload: {
    sectionId: string;
    title?: string;
    description?: string;
    order?: number;
  }): void {
    this._applicationService
      .addLegalItem(payload.sectionId, {
        title: payload.title,
        description: payload.description,
        order: payload.order
      })
      .subscribe({
        next: () => this.loadLegalSections()
      });
  }

  updateLegalItem(payload: {
    itemId: string;
    title?: string;
    description?: string;
    order?: number;
  }): void {
    this._applicationService
      .updateLegalItem(payload.itemId, {
        title: payload.title,
        description: payload.description,
        order: payload.order
      })
      .subscribe({
        next: () => this.loadLegalSections()
      });
  }

  addLegalChild(payload: {
    itemId: string;
    content: string;
    order?: number;
  }): void {
    this._applicationService
      .addLegalChild(payload.itemId, {
        content: payload.content,
        order: payload.order
      })
      .subscribe({
        next: () => this.loadLegalSections()
      });
  }

  updateLegalChild(payload: {
    childId: string;
    content: string;
    order?: number;
  }): void {
    this._applicationService
      .updateLegalChild(payload.childId, {
        content: payload.content,
        order: payload.order
      })
      .subscribe({
        next: () => this.loadLegalSections()
      });
  }

  deleteLegalItem(itemId: string): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: { title: 'Eliminar item', message: '¿Deseas eliminar este item?' }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteLegalItem(itemId).subscribe({
        next: () => this.loadLegalSections()
      });
    });
  }

  reorderLegalItems(payload: {
    sectionId: string;
    items: { id: string; order: number }[];
  }): void {
    this._applicationService
      .reorderLegalItems(payload.sectionId, payload.items)
      .subscribe();
  }

  reorderLegalChildren(payload: {
    itemId: string;
    items: { id: string; order: number }[];
  }): void {
    this._applicationService
      .reorderLegalChildren(payload.itemId, payload.items)
      .subscribe();
  }

  deleteLegalChild(childId: string): void {
    const ref = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Eliminar sub-item',
        message: '¿Deseas eliminar este sub-item?'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this._applicationService.deleteLegalChild(childId).subscribe({
        next: () => this.loadLegalSections()
      });
    });
  }
}
