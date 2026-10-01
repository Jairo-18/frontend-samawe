export interface InvoicePeriodTotals {
  daily?: number;
  weekly?: number;
  monthly?: number;
  yearly: number;
  totalAllTime?: number;
}
export interface BalancePeriod {
  totalInvoiceSale?: string;
  totalInvoiceBuy?: string;
  balanceInvoice?: string;
  periodDate?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
export interface InvoiceBalance {
  daily?: BalancePeriod;
  weekly?: BalancePeriod;
  monthly?: BalancePeriod;
  yearly?: BalancePeriod;
}
export interface TotalInventory {
  totalStock: number;
}
export interface ProductSummary {
  totalProductPriceSale?: number;
  totalProductPriceBuy?: number;
  balanceProduct?: number;
}
/** Totales de un período, netos de notas DIAN (`GET balance/dashboard`). */
export interface SalesDashboardTotals {
  sales: number;
  purchases: number;
  result: number;
  /** Facturas de venta con valor neto mayor que 0 (las anuladas no cuentan). */
  salesCount: number;
  purchasesCount: number;
}

/** Una casilla de la serie: una hora, un día o un mes según el período. */
export interface SalesDashboardBucket {
  /** Instante en que empieza la casilla. */
  start: string;
  sales: number;
  purchases: number;
  /** La casilla equivalente del período anterior (`null` si no existe). */
  previousSales: number | null;
  previousPurchases: number | null;
  /** Aún no llega: no se pinta como un cero real. */
  future: boolean;
}

/** Una porción de un desglose de ventas (categoría o forma de pago). */
export interface SalesBreakdownItem {
  key: string;
  name: string;
  total: number;
  count?: number;
}

/** Un producto, hospedaje o excursión de "lo más vendido". */
export interface SalesTopItem {
  name: string;
  category: string;
  quantity: number;
  total: number;
}

export type DashboardPeriodValue =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export interface SalesDashboard {
  period: DashboardPeriodValue;
  range: { start: string; end: string };
  previousRange: { start: string; end: string };
  current: SalesDashboardTotals;
  previous: SalesDashboardTotals;
  series: SalesDashboardBucket[];
  /** Ventas por categoría; suma lo mismo que `current.sales`. */
  byCategory: SalesBreakdownItem[];
  /** Ventas por forma de pago; suma exactamente `current.sales`. */
  byPayType: SalesBreakdownItem[];
  top: SalesTopItem[];
  generatedAt: string;
}

/** Productos con poco stock (`balance/paginated-list-inventory-low`). */
export interface LowInventoryResponse {
  data: { productId: number; name: Record<string, string>; amount: number }[];
  pagination: { total: number };
}

export interface InvoiceSummaryItem {
  code?: string;
  total?: number;
  type?: string;
  createdAt?: string;
}
export interface InvoiceSummaryGroupedResponse {
  daily?: InvoiceSummaryItem[];
  weekly?: InvoiceSummaryItem[];
  monthly?: InvoiceSummaryItem[];
  yearly?: InvoiceSummaryItem[];
}
export interface DashboardStateSummary {
  products?: {
    isActive: boolean;
    count: string;
  }[];
  accommodations?: {
    state:
      | 'Disponible'
      | 'Ocupado'
      | 'Mantenimiento'
      | 'Fuera de Servicio'
      | 'DISPONIBLE'
      | 'OCUPADO'
      | 'MANTENIMIENTO'
      | 'FUERA DE SERVICIO'
      | string;
    count: string;
  }[];
  excursions?: {
    state:
      | 'Disponible'
      | 'Ocupado'
      | 'Mantenimiento'
      | 'Fuera de Servicio'
      | 'DISPONIBLE'
      | 'OCUPADO'
      | 'MANTENIMIENTO'
      | 'FUERA DE SERVICIO'
      | string;
    count: string;
  }[];
  reservedAccommodations?: {
    accommodationId: number;
    invoiceId: number;
  }[];
}

