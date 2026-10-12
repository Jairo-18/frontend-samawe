import { ApiConfigService } from '../../shared/services/api-config.service';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import {
  Organizational,
  OrganizationalMedia,
  MediaType,
  CorporateValue,
  BenefitSection,
  LegalSection,
  LegalType
} from '../../shared/interfaces/organizational.interface';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { TranslatedInput } from '../../shared/types/translated-field.type';
import { BehaviorSubject, tap } from 'rxjs';
import { SeoService } from '../../shared/services/seo.service';
import {
  BODY_FONTS,
  TITLE_FONTS,
  resolveFontStack
} from '../../shared/constants/fonts.constants';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _seoService: SeoService = inject(SeoService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _apiConfig: ApiConfigService = inject(ApiConfigService);
  private _mediaMapSubject = new BehaviorSubject<Record<
    string,
    OrganizationalMedia[]
  > | null>(null);
  public mediaMap$ = this._mediaMapSubject.asObservable();

  private _currentOrgSubject = new BehaviorSubject<Organizational | null>(null);
  public currentOrg$ = this._currentOrgSubject.asObservable();

  private _orgCache = new Map<string, Observable<ApiResponseInterface<Organizational>>>();
  private _benefitCache = new Map<string, Observable<ApiResponseInterface<BenefitSection[]>>>();
  private _legalCache = new Map<string, Observable<ApiResponseInterface<LegalSection[]>>>();
  private _corporateCache = new Map<string, Observable<ApiResponseInterface<CorporateValue[]>>>();

  getOrganization(
    id: string,
    forceRefresh = false
  ): Observable<ApiResponseInterface<Organizational>> {
    if (forceRefresh || !this._orgCache.has(id)) {
      this._orgCache.set(
        id,
        this._http.get<ApiResponseInterface<Organizational>>(
          `${environment.apiUrl}organizational/${id}`
        ).pipe(shareReplay(1))
      );
    }
    return this._orgCache.get(id)!;
  }

  invalidateOrgCache(id: string): void {
    this._orgCache.delete(id);
  }

  getOrganizationBySlug(
    slug: string
  ): Observable<ApiResponseInterface<Organizational>> {
    return this._http.get<ApiResponseInterface<Organizational>>(
      `${environment.apiUrl}organizational/slug/${slug}`
    );
  }

  updateOrganization(
    id: string,
    data: Partial<Organizational>
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}organizational/${id}`,
      data
    );
  }

  getMedia(
    id: string
  ): Observable<ApiResponseInterface<Record<string, OrganizationalMedia[]>>> {
    return this._http
      .get<
        ApiResponseInterface<Record<string, OrganizationalMedia[]>>
      >(`${environment.apiUrl}organizational/${id}/media`)
      .pipe(
        tap((res) => {
          if (res.data) {
            this._mediaMapSubject.next(res.data);
          }
        })
      );
  }

  loadBrandingBySlug(slug: string, showLoader = false): void {
    this._loadBranding(
      this.getOrganizationBySlug(slug).pipe(map((res) => ({ org: res.data ?? null }))),
      showLoader,
      (org) => {
        // El id de Samawe: su panel usa la marca pública, sin recargarla.
        if (slug === 'ecohotelsamawe') {
          this._apiConfig.setDefaultOrganizationalId(org.organizationalId);
        }
      }
    );
  }

  /**
   * Marca de la organización de la SESIÓN en el panel: el admin de otro hotel
   * (o un superadmin que entró a otro hotel) ve la suya, no la de Samawe.
   * `organizational/:id` no trae los medios: van aparte y se aplican JUNTOS
   * (logo y colores a la vez, sin mezcla de dos hoteles mientras tanto).
   */
  loadPanelBranding(organizationalId: string, showLoader = false): void {
    this._loadBranding(
      forkJoin({
        org: this.getOrganization(organizationalId).pipe(map((res) => res.data ?? null)),
        media: this._http
          .get<ApiResponseInterface<Record<string, OrganizationalMedia[]>>>(
            `${environment.apiUrl}organizational/${organizationalId}/media`
          )
          .pipe(
            map((res) => res.data ?? null),
            catchError(() => of(null))
          )
      }),
      showLoader
    );
  }

  /** La organización cuya marca está aplicada ahora (o `null`). */
  get currentOrg(): Organizational | null {
    return this._currentOrgSubject.value;
  }

  /**
   * Hay una marca cargándose que todavía no se ve: la app tapa la pantalla con
   * un loader neutro (sin logo ni colores, que aún no se saben). Solo cuando
   * quien la pide lo indica: la web pública ya llega armada del servidor.
   */
  private _brandingLoadingSubject = new BehaviorSubject<boolean>(false);
  public brandingLoading$ = this._brandingLoadingSubject.asObservable();

  /**
   * Número de la última marca pedida. Al abrir la app pueden pedirse dos casi a
   * la vez; ganaba la que LLEGABA última y pisaba a la otra. Ahora solo se
   * aplica la última PEDIDA.
   */
  private _brandingRequest = 0;

  private _loadBranding(
    source: Observable<{
      org: Organizational | null;
      media?: Record<string, OrganizationalMedia[]> | null;
    }>,
    showLoader: boolean,
    beforeApply?: (org: Organizational) => void
  ): void {
    const request = ++this._brandingRequest;
    this._brandingLoadingSubject.next(showLoader);
    const done = () => {
      if (request === this._brandingRequest) this._brandingLoadingSubject.next(false);
    };
    source.subscribe({
      next: ({ org, media }) => {
        if (!org) return done();
        beforeApply?.(org);
        if (request !== this._brandingRequest) return; // llegó tarde: hay otra pedida después
        // applyFromOrg escribe el title/description GENÉRICOS de la
        // organización, así que va antes de publicar el org: las páginas
        // suscritas a currentOrg$ llaman updatePage() con su propio
        // title/description y deben ser las últimas en escribir. Al revés
        // (next → applyFromOrg) lo genérico pisaba lo específico y las
        // cuatro páginas terminaban con el mismo title en el HTML.
        this._seoService.applyFromOrg(org);
        this._currentOrgSubject.next(org);
        if (media) this._mediaMapSubject.next(media);
        else this.updateMediaFromOrg(org);
        this._applyBrandingStyles(org);
        done();
      },
      error: (err) => {
        console.error('Error loading branding:', err);
        done();
      }
    });
  }

  /**
   * Colores y tipografía de la organización en `<html>`. Lo que la
   * organización no define se BORRA: al pasar de una marca a otra (web pública
   * de Samawe <-> panel de otro hotel) no deben quedar colores de la anterior.
   */
  private _applyBrandingStyles(org: Organizational): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const style = document.documentElement.style;
    const set = (token: string, value: string | null | undefined) =>
      value ? style.setProperty(token, value) : style.removeProperty(token);
    set('--primary-color', org.primaryColor);
    set('--secondary-color', org.secondaryColor);
    set('--tertiary-color', org.tertiaryColor);
    // ⚠️ Estos cinco van a `--org-*`, NO a `--title-color` y compañía.
    //
    // `setProperty` escribe un estilo EN LÍNEA en `<html>`, que gana a
    // cualquier regla CSS: escribiendo directo en `--text-color`, el
    // modo oscuro no podría cambiarlo jamás. `variables.scss` lee estos
    // valores en modo claro y los ignora en oscuro, donde manda la capa
    // neutra. Los de MARCA (primario, secundario, terciario) sí van
    // directos: son identidad y no cambian con el tema.
    set('--org-title-color', org.titleColor);
    set('--org-subtitle-color', org.subtitleColor);
    set('--org-text-color', org.textColor);
    set('--org-bg-primary-color', org.bgPrimaryColor);
    set('--org-bg-secondary-color', org.bgSecondaryColor);
    // Modo oscuro. Se aplican SIEMPRE, esté o no activo: son variables
    // que solo lee el bloque `[data-theme='dark']`, así que en claro no
    // pintan nada y al encender el modo ya están puestas.
    set('--org-dark-title-color', org.darkTitleColor);
    set('--org-dark-subtitle-color', org.darkSubtitleColor);
    set('--org-dark-text-color', org.darkTextColor);
    set('--org-dark-bg-primary-color', org.darkBgPrimaryColor);
    set('--org-dark-bg-secondary-color', org.darkBgSecondaryColor);
    // Tipografía. A diferencia de los colores, el valor guardado NO se
    // aplica tal cual: se resuelve contra el catálogo del front, que
    // es una lista cerrada. Así, lo que no esté en ella —una familia
    // retirada, o un valor manipulado en la base— se ignora y queda el
    // de `variables.scss`, en vez de acabar dentro del `setProperty`.
    set('--font-title', resolveFontStack(org.fontTitle, TITLE_FONTS));
    set('--font-body', resolveFontStack(org.fontBody, BODY_FONTS));
  }

  private updateMediaFromOrg(org: Organizational): void {
    if (org.medias) {
      const mediaMap: Record<string, OrganizationalMedia[]> = {};
      org.medias.forEach((m) => {
        const type = m.mediaType.code;
        if (!mediaMap[type]) mediaMap[type] = [];
        mediaMap[type].push(m);
      });
      this._mediaMapSubject.next(mediaMap);
      this._preloadAuthBackgrounds(mediaMap);
    }
  }

  private _preloadAuthBackgrounds(
    mediaMap: Record<string, OrganizationalMedia[]>
  ): void {
    if (!isPlatformBrowser(this._platformId)) return;
    ['LOGIN_BG', 'REGISTER_BG'].forEach((code) => {
      const url = mediaMap[code]?.[0]?.url;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }

  loadMedia(id: string): void {
    this.getMedia(id).subscribe();
  }

  uploadMedia(
    id: string,
    media: Partial<OrganizationalMedia>
  ): Observable<ApiResponseInterface<OrganizationalMedia>> {
    return this._http.post<ApiResponseInterface<OrganizationalMedia>>(
      `${environment.apiUrl}organizational/${id}/media`,
      media
    );
  }

  updateMedia(
    mediaId: string,
    data: Partial<OrganizationalMedia>
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}organizational/media/${mediaId}`,
      data
    );
  }

  deleteMedia(mediaId: string): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}organizational/media/${mediaId}`
    );
  }

  getCorporateValues(
    id: string,
    forceRefresh = false
  ): Observable<ApiResponseInterface<CorporateValue[]>> {
    if (forceRefresh || !this._corporateCache.has(id)) {
      this._corporateCache.set(
        id,
        this._http.get<ApiResponseInterface<CorporateValue[]>>(
          `${environment.apiUrl}organizational/${id}/corporate-values`
        ).pipe(shareReplay(1))
      );
    }
    return this._corporateCache.get(id)!;
  }

  invalidateCorporateCache(id: string): void {
    this._corporateCache.delete(id);
  }

  createCorporateValue(
    id: string,
    data: Omit<CorporateValue, 'corporateValueId'>
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}organizational/${id}/corporate-values`,
      data
    );
  }

  updateCorporateValue(
    valueId: string,
    data: Partial<CorporateValue>
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}organizational/corporate-values/${valueId}`,
      data
    );
  }

  deleteCorporateValue(
    valueId: string
  ): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}organizational/corporate-values/${valueId}`
    );
  }

  uploadCorporateValueImage(
    valueId: string,
    file: File
  ): Observable<
    ApiResponseInterface<{ imageUrl: string; imagePublicId: string }>
  > {
    const formData = new FormData();
    formData.append('file', file);
    return this._http.post<
      ApiResponseInterface<{ imageUrl: string; imagePublicId: string }>
    >(
      `${environment.apiUrl}organizational/corporate-values/${valueId}/upload-image`,
      formData
    );
  }

  deleteCorporateValueImage(
    valueId: string
  ): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}organizational/corporate-values/${valueId}/image`
    );
  }

  getBenefitSections(
    organizationalId: string,
    forceRefresh = false
  ): Observable<ApiResponseInterface<BenefitSection[]>> {
    if (forceRefresh || !this._benefitCache.has(organizationalId)) {
      this._benefitCache.set(
        organizationalId,
        this._http.get<ApiResponseInterface<BenefitSection[]>>(
          `${environment.apiUrl}benefit-section/organizational/${organizationalId}`
        ).pipe(shareReplay(1))
      );
    }
    return this._benefitCache.get(organizationalId)!;
  }

  invalidateBenefitCache(organizationalId: string): void {
    this._benefitCache.delete(organizationalId);
  }

  createBenefitSection(
    organizationalId: string,
    data: { title: TranslatedInput; order?: number }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}benefit-section/organizational/${organizationalId}`,
      data
    );
  }

  updateBenefitSection(
    sectionId: string,
    data: { title?: TranslatedInput; order?: number }
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}benefit-section/${sectionId}`,
      data
    );
  }

  deleteBenefitSection(
    sectionId: string
  ): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}benefit-section/${sectionId}`
    );
  }

  addBenefitItem(
    sectionId: string,
    data: { name: TranslatedInput; icon: string; order?: number }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}benefit-section/${sectionId}/items`,
      data
    );
  }

  updateBenefitItem(
    itemId: string,
    data: { name?: TranslatedInput; icon?: string; order?: number }
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}benefit-section/items/${itemId}`,
      data
    );
  }

  deleteBenefitItem(itemId: string): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}benefit-section/items/${itemId}`
    );
  }

  getLegalSections(
    organizationalId: string,
    forceRefresh = false
  ): Observable<ApiResponseInterface<LegalSection[]>> {
    if (forceRefresh || !this._legalCache.has(organizationalId)) {
      this._legalCache.set(
        organizationalId,
        this._http.get<ApiResponseInterface<LegalSection[]>>(
          `${environment.apiUrl}legal/organizational/${organizationalId}`
        ).pipe(shareReplay(1))
      );
    }
    return this._legalCache.get(organizationalId)!;
  }

  invalidateLegalCache(organizationalId: string): void {
    this._legalCache.delete(organizationalId);
  }

  createLegalSection(
    organizationalId: string,
    data: {
      type: LegalType;
      items?: { title?: TranslatedInput; content: TranslatedInput; order?: number }[];
    }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}legal/organizational/${organizationalId}`,
      data
    );
  }

  deleteLegalSection(
    sectionId: string
  ): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/${sectionId}`
    );
  }

  addLegalItem(
    sectionId: string,
    data: { title?: TranslatedInput; description?: TranslatedInput; order?: number }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}legal/${sectionId}/items`,
      data
    );
  }

  updateLegalItem(
    itemId: string,
    data: { title?: TranslatedInput; description?: TranslatedInput; order?: number }
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/items/${itemId}`,
      data
    );
  }

  deleteLegalItem(itemId: string): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/items/${itemId}`
    );
  }

  addLegalChild(
    itemId: string,
    data: { content: TranslatedInput; order?: number }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}legal/items/${itemId}/children`,
      data
    );
  }

  updateLegalChild(
    childId: string,
    data: { content?: TranslatedInput; order?: number }
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/children/${childId}`,
      data
    );
  }

  deleteLegalChild(childId: string): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/children/${childId}`
    );
  }

  reorderLegalItems(
    sectionId: string,
    items: { id: string; order: number }[]
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/${sectionId}/items/reorder`,
      { items }
    );
  }

  reorderLegalChildren(
    itemId: string,
    items: { id: string; order: number }[]
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${environment.apiUrl}legal/items/${itemId}/children/reorder`,
      { items }
    );
  }

  getMediaTypes(): Observable<ApiResponseInterface<MediaType[]>> {
    return this._http.get<ApiResponseInterface<MediaType[]>>(
      `${environment.apiUrl}organizational/media-types`
    );
  }

  uploadFile(
    id: string,
    mediaTypeId: number,
    file: File
  ): Observable<ApiResponseInterface<OrganizationalMedia>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaTypeId', mediaTypeId.toString());
    return this._http.post<ApiResponseInterface<OrganizationalMedia>>(
      `${environment.apiUrl}organizational/${id}/upload-media`,
      formData
    );
  }
}
