export interface MenuResponse {
  menuId: number;
  name: string;
  description?: string;
  recipes: MenuRecipeItem[];
  organizationalId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MenuRecipeItem {
  recipeId: number;
  product: {
    productId: number;
    name: string;
    images?: {
      productImageId: number;
      imageUrl: string;
      publicId: string;
    }[];
  };
  ingredient: {
    productId: number;
    name: string;
    amount?: number;
    unitOfMeasure?: {
      code: string;
    };
  };
  quantity: number;
  notes?: string;
}

export interface CreateMenuDto {
  name: string;
  description?: string;
  productIds: number[];
  organizationalId?: string;
}

export interface UpdateMenuDto {
  name?: string;
  description?: string;
  productIds?: number[];
  organizationalId?: string;
}

/**
 * Grouped recipe data for display in menu cards
 */
export interface MenuRecipeGrouped {
  productId: number;
  productName: string;
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
