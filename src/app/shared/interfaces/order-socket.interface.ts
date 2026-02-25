export interface OrderUpdate {
  invoiceId: number;
  code: string;
  state: string;
  stateCode: string;
  tableNumber?: string;
  updatedAt: Date | string;
}

