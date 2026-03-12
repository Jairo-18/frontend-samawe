export interface PaginationInterface {
  page: number;
  perPage: number;
  total: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface ParamsPaginationInterface {
  order?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
  search?: string;
  userId?: string;
}

export interface BasePaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  order?: 'ASC' | 'DESC';
  organizationalId?: string;
  name?: string;
  categoryType?: number;
  excludeCategoryTypeCode?: string;
  hasTable?: boolean;
  isActive?: boolean;
  clientName?: string;
  categoryTypeCode?: string;
  excludeWithRecipe?: boolean;
}

export interface UserPaginationParams extends BasePaginationParams {
  userId?: string;
}

