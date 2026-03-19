import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  Organizational,
  OrganizationalMedia,
  MediaType
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
  private readonly apiUrl = `${environment.apiUrl}organizational`;

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
      `${this.apiUrl}/${id}`
    );
  }

  updateOrganization(
    id: string,
    data: Partial<Organizational>
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  getMedia(
    id: string
  ): Observable<ApiResponseInterface<Record<string, OrganizationalMedia[]>>> {
    return this._http
      .get<
        ApiResponseInterface<Record<string, OrganizationalMedia[]>>
      >(`${this.apiUrl}/${id}/media`)
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
      `${this.apiUrl}/${id}/media`,
      media
    );
  }

  updateMedia(
    mediaId: string,
    data: Partial<OrganizationalMedia>
  ): Observable<ApiResponseInterface<void>> {
    return this._http.patch<ApiResponseInterface<void>>(
      `${this.apiUrl}/media/${mediaId}`,
      data
    );
  }

  deleteMedia(mediaId: string): Observable<ApiResponseInterface<void>> {
    return this._http.delete<ApiResponseInterface<void>>(
      `${this.apiUrl}/media/${mediaId}`
    );
  }

  getMediaTypes(): Observable<ApiResponseInterface<MediaType[]>> {
    return this._http.get<ApiResponseInterface<MediaType[]>>(
      `${this.apiUrl}/media-types`
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
      `${this.apiUrl}/${id}/upload-media`,
      formData
    );
  }
}
