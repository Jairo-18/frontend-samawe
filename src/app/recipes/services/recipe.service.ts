import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CheckAvailabilityResponse,
  CreateRecipeDto,
  RecipeWithDetails
} from '../interfaces/recipe.interface';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);

  getPaginated(query: object): Observable<{
    data: RecipeWithDetails[];
    pagination: PaginationInterface;
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      data: RecipeWithDetails[];
      pagination: PaginationInterface;
    }>(`${environment.apiUrl}recipes/paginated`, { params });
  }

  getByProduct(
    productId: number
  ): Observable<{ statusCode: number; data: RecipeWithDetails }> {
    return this._httpClient.get<{
      statusCode: number;
      data: RecipeWithDetails;
    }>(`${environment.apiUrl}recipes/product/${productId}`);
  }

  create(
    dto: CreateRecipeDto
  ): Observable<{ message: string; statusCode: number; data: unknown }> {
    return this._httpClient.post<{
      message: string;
      statusCode: number;
      data: unknown;
    }>(`${environment.apiUrl}recipes`, dto);
  }

  updateByProduct(
    productId: number,
    dto: { ingredients: CreateRecipeDto['ingredients'] }
  ): Observable<{ message: string; statusCode: number; data: unknown }> {
    return this._httpClient.patch<{
      message: string;
      statusCode: number;
      data: unknown;
    }>(`${environment.apiUrl}recipes/product/${productId}`, dto);
  }

  checkAvailability(
    productId: number,
    portions: number = 1
  ): Observable<{ statusCode: number; data: CheckAvailabilityResponse }> {
    return this._httpClient.post<{
      statusCode: number;
      data: CheckAvailabilityResponse;
    }>(`${environment.apiUrl}recipes/check-availability`, {
      productId,
      portions
    });
  }

  deleteByProduct(
    productId: number
  ): Observable<{ message: string; statusCode: number }> {
    return this._httpClient.delete<{ message: string; statusCode: number }>(
      `${environment.apiUrl}recipes/product/${productId}`
    );
  }

  deleteIngredient(
    recipeId: number
  ): Observable<{ message: string; statusCode: number }> {
    return this._httpClient.delete<{ message: string; statusCode: number }>(
      `${environment.apiUrl}recipes/${recipeId}`
    );
  }
}
