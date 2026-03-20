import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  MenuResponse,
  CreateMenuDto,
  UpdateMenuDto
} from '../interfaces/menu.interface';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService =
    inject(HttpUtilitiesService);

  getPaginated(query: object): Observable<{
    data: MenuResponse[];
    pagination: PaginationInterface;
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<{
      data: MenuResponse[];
      pagination: PaginationInterface;
    }>(`${environment.apiUrl}menus/paginated`, { params });
  }

  getById(
    menuId: number
  ): Observable<{ statusCode: number; data: MenuResponse }> {
    return this._httpClient.get<{
      statusCode: number;
      data: MenuResponse;
    }>(`${environment.apiUrl}menus/${menuId}`);
  }

  create(
    dto: CreateMenuDto
  ): Observable<{ message: string; statusCode: number; data: MenuResponse }> {
    return this._httpClient.post<{
      message: string;
      statusCode: number;
      data: MenuResponse;
    }>(`${environment.apiUrl}menus`, dto);
  }

  update(
    menuId: number,
    dto: UpdateMenuDto
  ): Observable<{ message: string; statusCode: number; data: MenuResponse }> {
    return this._httpClient.patch<{
      message: string;
      statusCode: number;
      data: MenuResponse;
    }>(`${environment.apiUrl}menus/${menuId}`, dto);
  }

  delete(menuId: number): Observable<{ message: string; statusCode: number }> {
    return this._httpClient.delete<{ message: string; statusCode: number }>(
      `${environment.apiUrl}menus/${menuId}`
    );
  }

  removeProduct(
    menuId: number,
    productId: number
  ): Observable<{ message: string; statusCode: number; data: MenuResponse }> {
    return this._httpClient.delete<{
      message: string;
      statusCode: number;
      data: MenuResponse;
    }>(`${environment.apiUrl}menus/${menuId}/product/${productId}`);
  }
}
