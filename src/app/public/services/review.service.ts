import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { Review, ReviewReply } from '../../shared/interfaces/review.interface';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly _http: HttpClient = inject(HttpClient);

  getAll(
    organizationalId?: string
  ): Observable<ApiResponseInterface<Review[]>> {
    const params: Record<string, string> = {};
    if (organizationalId) params['organizationalId'] = organizationalId;
    return this._http.get<ApiResponseInterface<Review[]>>(
      `${environment.apiUrl}reviews`,
      { params }
    );
  }

  getPaginated(
    organizationalId: string,
    page: number,
    perPage: number = 15,
    search?: string,
    filter?: 'all' | '1' | '2' | '3' | '4' | '5',
    sort?: 'newest' | 'oldest'
  ): Observable<{ data: Review[]; pagination: PaginationInterface }> {
    const params: Record<string, string> = {
      organizationalId,
      page: String(page),
      perPage: String(perPage)
    };
    if (search?.trim()) params['search'] = search.trim();
    if (filter && filter !== 'all') params['filter'] = filter;
    if (sort) params['sort'] = sort;
    return this._http.get<{ data: Review[]; pagination: PaginationInterface }>(
      `${environment.apiUrl}reviews/paginated`,
      { params }
    );
  }

  create(body: {
    title: string;
    comment: string;
    score: number;
    organizationalId: string;
  }): Observable<ApiResponseInterface<Review>> {
    return this._http.post<ApiResponseInterface<Review>>(
      `${environment.apiUrl}reviews`,
      body
    );
  }

  update(
    reviewId: number,
    body: { title?: string; comment?: string; score?: number }
  ): Observable<ApiResponseInterface<Review>> {
    return this._http.patch<ApiResponseInterface<Review>>(
      `${environment.apiUrl}reviews/${reviewId}`,
      body
    );
  }

  remove(reviewId: number): Observable<ApiResponseInterface<null>> {
    return this._http.delete<ApiResponseInterface<null>>(
      `${environment.apiUrl}reviews/${reviewId}`
    );
  }

  createReply(
    reviewId: number,
    body: { comment: string }
  ): Observable<ApiResponseInterface<ReviewReply>> {
    return this._http.post<ApiResponseInterface<ReviewReply>>(
      `${environment.apiUrl}reviews/${reviewId}/replies`,
      body
    );
  }

  updateReply(
    reviewId: number,
    replyId: number,
    body: { comment: string }
  ): Observable<ApiResponseInterface<ReviewReply>> {
    return this._http.patch<ApiResponseInterface<ReviewReply>>(
      `${environment.apiUrl}reviews/${reviewId}/replies/${replyId}`,
      body
    );
  }

  removeReply(
    reviewId: number,
    replyId: number
  ): Observable<ApiResponseInterface<null>> {
    return this._http.delete<ApiResponseInterface<null>>(
      `${environment.apiUrl}reviews/${reviewId}/replies/${replyId}`
    );
  }
}
