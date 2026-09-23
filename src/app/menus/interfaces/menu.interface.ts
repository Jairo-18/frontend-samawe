import { TranslatedField, TranslatedInput } from '../../shared/types/translated-field.type';

export interface MenuResponse {
  menuId: number;
  name: TranslatedField;
  description?: TranslatedField;
  recipes: MenuRecipeItem[];
  organizationalId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MenuRecipeItem {
  recipeId: number;
  product: {
    productId: number;
    name: TranslatedField;
    priceSale: number;
    images?: {
      productImageId: number;
      imageUrl: string;
      publicId: string;
    }[];
  };
  ingredient: {
    productId: number;
    name: TranslatedField;
    amount?: number;
    unitOfMeasure?: {
      code: string;
    };
  };
  quantity: number;
  notes?: string;
}

export interface CreateMenuDto {
  name: TranslatedInput;
  description?: TranslatedInput;
  productIds: number[];
  organizationalId?: string;
}

export interface UpdateMenuDto {
  name?: TranslatedInput;
  description?: TranslatedInput;
  productIds?: number[];
  organizationalId?: string;
}

export interface MenuPublicDishItem {
  productId: number;
  name: TranslatedField;
  priceSale: number;
  images: { productImageId: number; imageUrl: string; publicId: string }[];
}

/** Listado público para la página de gastronomía. */
export interface MenuPublicListItem {
  menuId: number;
  name: TranslatedField;
  description?: TranslatedField;
  dishes: MenuPublicDishItem[];
}

export interface MenuRecipeGrouped {
  productId: number;
  productName: string;
  priceSale: number;
  images?: {
    productImageId: number;
    imageUrl: string;
    publicId: string;
  }[];
  ingredients: {
    ingredientProductId: number;
    ingredientProductName: string;
    unit: string;
    quantity: number;
  }[];
}
