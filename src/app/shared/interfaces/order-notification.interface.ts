export interface OrderNotification {
  notificationId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  metadata?: {
    invoiceId: number;
    code: string;
    tableNumber?: string;
    state: string;
    stateCode: string;
    orderTime?: string;
    readyTime?: string;
    servedTime?: string;
  };
  createdAt: string | Date;
}
