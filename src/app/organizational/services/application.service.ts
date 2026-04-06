import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  Organizational,
  OrganizationalMedia,
  MediaType,
  CorporateValue,
  BenefitSection
} from '../../shared/interfaces/organizational.interface';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { BehaviorSubject, tap } from 'rxjs';
import { RelatedDataService } from '../../shared/services/relatedData.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private _mediaMapSubject = new BehaviorSubject<Record<
    string,
    OrganizationalMedia[]
  > | null>(null);
  public mediaMap$ = this._mediaMapSubject.asObservable();

  private _currentOrgSubject = new BehaviorSubject<Organizational | null>(null);
  public currentOrg$ = this._currentOrgSubject.asObservable();

  getOrganization(
    id: string
  ): Observable<ApiResponseInterface<Organizational>> {
    return this._http.get<ApiResponseInterface<Organizational>>(
      `${environment.apiUrl}organizational/${id}`
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

  loadBrandingBySlug(slug: string): void {
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        if (res.data && res.data.organizational) {
          const org = res.data.organizational.find((o) => o.slug === slug);
          if (org) {
            this._currentOrgSubject.next(org);
            this.updateMediaFromOrg(org);

            if (org.primaryColor) {
              document.documentElement.style.setProperty(
                '--primary-color',
                org.primaryColor
              );
            }
            if (org.secondaryColor) {
              document.documentElement.style.setProperty(
                '--secondary-color',
                org.secondaryColor
              );
            }
            if (org.tertiaryColor) {
              document.documentElement.style.setProperty(
                '--tertiary-color',
                org.tertiaryColor
              );
            }
          }
        }
      },
      error: (err) =>
        console.error('Error loading branding from related-data:', err)
    });
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
    }
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
    id: string
  ): Observable<ApiResponseInterface<CorporateValue[]>> {
    return this._http.get<ApiResponseInterface<CorporateValue[]>>(
      `${environment.apiUrl}organizational/${id}/corporate-values`
    );
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
    organizationalId: string
  ): Observable<ApiResponseInterface<BenefitSection[]>> {
    return this._http.get<ApiResponseInterface<BenefitSection[]>>(
      `${environment.apiUrl}benefit-section/organizational/${organizationalId}`
    );
  }

  createBenefitSection(
    organizationalId: string,
    data: { title: string; order?: number }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}benefit-section/organizational/${organizationalId}`,
      data
    );
  }

  updateBenefitSection(
    sectionId: string,
    data: { title?: string; order?: number }
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
    data: { name: string; icon: string; order?: number }
  ): Observable<ApiResponseInterface<{ rowId: string }>> {
    return this._http.post<ApiResponseInterface<{ rowId: string }>>(
      `${environment.apiUrl}benefit-section/${sectionId}/items`,
      data
    );
  }

  updateBenefitItem(
    itemId: string,
    data: { name?: string; icon?: string; order?: number }
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
