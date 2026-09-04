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
  /**
   * Rango ISO para filtrar hospedajes por disponibilidad. Si se mandan las dos,
   * el backend excluye los que ya tienen una reserva solapada.
   */
  startDate?: string;
  endDate?: string;
}

export interface UserPaginationParams extends BasePaginationParams {
  userId?: string;
}

