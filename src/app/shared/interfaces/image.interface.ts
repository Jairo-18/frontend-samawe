export interface ImageItem {
  imageId: number;
  imageUrl: string;
  publicId: string;
}
export type RawImageItem = Record<string, string | number>;
export interface GenericImageResponse {
  statusCode: number;
  message: string;
  data: RawImageItem;
}
export interface GenericImageArrayResponse {
  statusCode: number;
  message: string;
  data: RawImageItem[];
}

