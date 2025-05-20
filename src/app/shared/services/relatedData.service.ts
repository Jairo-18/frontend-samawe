import {
  CreateUserRelatedData,
  RegisterUserRelatedData
} from './../../auth/interfaces/register.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment.development';
import { CreateProductRelatedData } from '../../service-and-product/interface/product.interface';
import { CreateAccommodationRelatedData } from '../../service-and-product/interface/accommodation.interface';

@Injectable({
  providedIn: 'root'
})
export class RelatedDataService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  registerUserRelatedData(): Observable<
    ApiResponseInterface<RegisterUserRelatedData>
  > {
    return this._httpClient.get<ApiResponseInterface<RegisterUserRelatedData>>(
      `${environment.apiUrl}user/register/related-data`
    );
  }

  createUserRelatedData(): Observable<
    ApiResponseInterface<CreateUserRelatedData>
  > {
    return this._httpClient.get<ApiResponseInterface<CreateUserRelatedData>>(
      `${environment.apiUrl}user/create/related-data`
    );
  }

  createProductRelatedData(): Observable<
    ApiResponseInterface<CreateProductRelatedData>
  > {
    return this._httpClient.get<ApiResponseInterface<CreateProductRelatedData>>(
      `${environment.apiUrl}product/create/related-data`
    );
  }

  createAccommodationRelatedData(): Observable<
    ApiResponseInterface<CreateAccommodationRelatedData>
  > {
    return this._httpClient.get<
      ApiResponseInterface<CreateAccommodationRelatedData>
    >(`${environment.apiUrl}accommodation/create/related-data`);
  }
}
