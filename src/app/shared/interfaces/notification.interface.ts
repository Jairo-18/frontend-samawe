export interface PaginatedNotification {
  notificationId: string;
  title: string;
  message: string;
  read: boolean;
  metadata: {
    invoiceId?: number;
    productId?: number;
    threshold?: number;
    productName?: string;
    currentStock?: number;
    [key: string]: any;
  };
  type: 'LOW_PRODUCT' | string;
  createdAt: string;
}

