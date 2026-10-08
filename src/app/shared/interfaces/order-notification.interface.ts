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
    // Solicitudes de reserva (stateCode 'RSV')
    guestName?: string;
    accommodationName?: string;
    startDate?: string;
    endDate?: string;
    nights?: number;
    guests?: number;
    total?: number;
    expiresAt?: string;
  };
  createdAt: string | Date;
}
