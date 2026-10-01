export type CreditStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface CreditInstallment {
  number: number;
  dueDate: string;
  amount: number;
  paid: number;
  pending: number;
  status: CreditStatus;
}

export interface CreditPayment {
  invoicePaymentId: number;
  amount: number;
  paidAt: string;
  note: string | null;
  payTypeId: number | null;
}

/** Cartera de una factura a crédito, tal como la devuelve `GET invoices/:id/credit`. */
export interface InvoiceCredit {
  invoiceId: number;
  creditDays: number | null;
  creditStartDate: string | null;
  dueDate: string | null;
  /** Lo que se debe pagar: total de la factura + notas débito − notas crédito. */
  total: number;
  /** Total original de la factura, antes de notas. */
  invoiceTotal: number;
  /** Notas débito − notas crédito (negativo = bajó lo que se debe). */
  notesNet: number;
  /** Abonado por encima de lo que se debe tras las notas (a favor del cliente). */
  overpaid: number;
  paid: number;
  balance: number;
  status: CreditStatus;
  installments: CreditInstallment[];
  payments: CreditPayment[];
}

export interface CreateCreditPaymentPayload {
  amount: number;
  payTypeId?: number;
  paidAt?: string;
  note?: string;
}

export interface ReceivableRow {
  invoiceId: number;
  code: string;
  factusNumber: string | null;
  clientName: string;
  clientIdentification: string;
  total: number;
  paid: number;
  balance: number;
  creditDays: number | null;
  dueDate: string | null;
  oldestOverdueDate: string | null;
  status: CreditStatus | 'NO_TERM';
}
