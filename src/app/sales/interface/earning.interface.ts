export interface InvoicePeriodTotals {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  totalAllTime: number;
}

export interface InvoiceStatsResponse {
  invoiceSale: InvoicePeriodTotals;
  invoiceBuy: InvoicePeriodTotals;
}

export interface SalesSummaryByCategory {
  products: TimePeriodStats;
  accommodations: TimePeriodStats;
  excursions: TimePeriodStats;
}

export interface TimePeriodStats {
  daily: CountTotal;
  weekly: CountTotal;
  monthly: CountTotal;
  yearly: CountTotal;
}

export interface CountTotal {
  count: number;
  total: number;
}

export interface TotalInventory {
  totalInventoryValue: number;
}

export interface Total {
  total: number;
}
