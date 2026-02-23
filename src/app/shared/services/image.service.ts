import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  GenericImageResponse,
  GenericImageArrayResponse,
  ImageItem,
  RawImageItem
} from '../interfaces/image.interface';

export type EntityType = 'product' | 'accommodation' | 'excursion';

export interface UploadResponse {
  item: ImageItem;
  message: string;
}

export interface DeleteResponse {
  statusCode: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  /**
   * Sube una imagen para una entidad específica (product, accommodation o excursion)
   */
  uploadImage(
    entityType: EntityType,
    entityId: number,
    file: File
  ): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this._httpClient
      .post<GenericImageResponse>(
        `${environment.apiUrl}${entityType}/${entityId}/images`,
        formData
      )
      .pipe(
        map((res) => ({
          item: this.mapResponseToStandardItem(entityType, res.data),
          message: res.message
        }))
      );
  }

  /**
   * Obtiene todas las imágenes de una entidad
   */
  getImages(entityType: EntityType, entityId: number): Observable<ImageItem[]> {
    return this._httpClient
      .get<GenericImageArrayResponse>(
        `${environment.apiUrl}${entityType}/${entityId}/images`
      )
      .pipe(
        map((res) =>
          res.data.map((item) =>
            this.mapResponseToStandardItem(entityType, item)
          )
        )
      );
  }

  /**
   * Elimina una imagen de una entidad
   */
  deleteImage(
    entityType: EntityType,
    entityId: number,
    publicId: string
  ): Observable<DeleteResponse> {
    // Es necesario encodificar el publicId para enviarlo por URL dado que puede contener slashes (ej: products/uuid.webp)
    const encodedPublicId = encodeURIComponent(publicId);
    return this._httpClient.delete<DeleteResponse>(
      `${environment.apiUrl}${entityType}/${entityId}/images/${encodedPublicId}`
    );
  }

  /**
   * Mapea dinámicamente el ID del tipo de imagen devuelto a un imageId estándar
   */
  public mapResponseToStandardItem(
    type: EntityType,
    item: RawImageItem
  ): ImageItem {
    let id = 0;
    if (type === 'product') id = Number(item['productImageId']);
    if (type === 'accommodation') id = Number(item['accommodationImageId']);
    if (type === 'excursion') id = Number(item['excursionImageId']);

    return {
      imageId: id || Number(item['imageId']),
      imageUrl: String(item['imageUrl']),
      publicId: String(item['publicId'])
    };
  }
}
