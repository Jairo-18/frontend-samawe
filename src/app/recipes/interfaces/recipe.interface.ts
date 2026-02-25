import { ProductComplete } from '../../service-and-product/interface/product.interface';

export interface RecipeIngredient {
  ingredientProductId: number;
  ingredientProductName: string;
  unit: string;
  quantity: number;
  cost: number;
  totalCost: number;
  notes?: string;
}

export interface RecipeWithDetails {
  productId: number;
  productName: string;
  images?: {
    productImageId: number;
    imageUrl: string;
    publicId: string;
  }[];
  ingredients: RecipeIngredient[];
  totalRecipeCost: number;
  availablePortions?: number;
  product?: ProductComplete;
}

export interface CreateRecipeDto {
  productId: number;
  ingredients: CreateRecipeIngredientDto[];
}

export interface CreateRecipeIngredientDto {
  ingredientProductId: number;
  quantity: number;
  notes?: string;
}

export interface CheckAvailabilityResponse {
  productId: number;
  productName: string;
  portions: number;
  canPrepare: boolean;
  ingredients: IngredientAvailability[];
  missingIngredients: IngredientAvailability[];
}

export interface IngredientAvailability {
  ingredientProductId: number;
  ingredientProductName: string;
  required: number;
  available: number;
  unit: string;
  isAvailable: boolean;
}
