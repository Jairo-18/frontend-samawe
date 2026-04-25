import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GoogleBusinessStatus {
  connected: boolean;
  accountName: string | null;
  locationName: string | null;
}

export interface GoogleBusinessAccount {
  name: string;
  accountName: string;
  type: string;
}

export interface GoogleBusinessLocation {
  name: string;
  title: string;
}

export interface GoogleReview {
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

@Injectable({ providedIn: 'root' })
export class GoogleBusinessService {
  private readonly _http = inject(HttpClient);
  private readonly _base = `${environment.apiUrl}organizational/google-business`;

  getOAuthUrl(organizationalId: string): Observable<{ data: { url: string } }> {
    return this._http.get<{ data: { url: string } }>(
      `${this._base}/oauth-url?organizationalId=${organizationalId}`,
    );
  }

  getStatus(organizationalId: string): Observable<{ data: GoogleBusinessStatus }> {
    return this._http.get<{ data: GoogleBusinessStatus }>(
      `${this._base}/status?organizationalId=${organizationalId}`,
    );
  }

  getAccounts(organizationalId: string): Observable<{ data: GoogleBusinessAccount[] }> {
    return this._http.get<{ data: GoogleBusinessAccount[] }>(
      `${this._base}/accounts?organizationalId=${organizationalId}`,
    );
  }

  getLocations(organizationalId: string, accountName: string): Observable<{ data: GoogleBusinessLocation[] }> {
    return this._http.get<{ data: GoogleBusinessLocation[] }>(
      `${this._base}/locations?organizationalId=${organizationalId}&accountName=${encodeURIComponent(accountName)}`,
    );
  }

  saveLocation(
    organizationalId: string,
    accountName: string,
    locationName: string,
  ): Observable<any> {
    return this._http.patch(`${this._base}/location`, {
      organizationalId,
      accountName,
      locationName,
    });
  }

  disconnect(organizationalId: string): Observable<any> {
    return this._http.delete(
      `${this._base}/disconnect?organizationalId=${organizationalId}`,
    );
  }

  getGoogleReviews(organizationalId: string): Observable<{ data: GoogleReview[] }> {
    return this._http.get<{ data: GoogleReview[] }>(
      `${environment.apiUrl}reviews/google?organizationalId=${organizationalId}`,
    );
  }

  starRatingToNumber(rating: GoogleReview['starRating']): number {
    const map: Record<GoogleReview['starRating'], number> = {
      ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    };
    return map[rating] ?? 0;
  }
}
