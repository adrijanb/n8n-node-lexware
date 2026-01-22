export interface LexwareCredentials {
  accessToken: string;
  baseUrl: string;
}

export interface ArticlePrice {
  netPrice?: number;
  grossPrice?: number;
  leadingPrice?: "NET" | "GROSS";
  taxRate?: number;
}

export interface Article {
  id?: string;
  version?: number;
  title?: string;
  description?: string;
  type?: "PRODUCT" | "SERVICE";
  articleNumber?: string;
  gtin?: string;
  note?: string;
  unitName?: string;
  price?: ArticlePrice;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id?: string;
  version?: number;
  roles?: {
    customer?: Record<string, unknown>;
    vendor?: Record<string, unknown>;
  };
  company?: {
    name?: string;
    taxNumber?: string;
    vatRegistrationId?: string;
    allowTaxFreeInvoices?: boolean;
    contactPersons?: Array<{
      salutation?: string;
      firstName?: string;
      lastName?: string;
      emailAddress?: string;
      phoneNumber?: string;
    }>;
  };
  addresses?: {
    billing?: Array<Record<string, unknown>>;
    shipping?: Array<Record<string, unknown>>;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DunningLineItemPrice {
  currency?: string;
  netAmount?: number;
  grossAmount?: number;
  taxRatePercentage?: number;
}

export interface DunningLineItem {
  id?: string | null;
  type?: "custom" | "text";
  name?: string;
  description?: string | null;
  quantity?: number;
  unitName?: string;
  unitPrice?: DunningLineItemPrice;
  discountPercentage?: number;
  lineItemAmount?: number;
}

export interface DunningTotalPrice {
  currency?: string;
  totalNetAmount?: number;
  totalGrossAmount?: number;
  totalTaxAmount?: number;
}

export interface Dunning {
  id?: string | null;
  voucherDate?: string;
  address?: {
    contactId?: string | null;
    name?: string;
    supplement?: string;
    street?: string;
    city?: string;
    zip?: string;
    countryCode?: string;
  };
  lineItems?: DunningLineItem[];
  totalPrice?: DunningTotalPrice;
  title?: string;
  introduction?: string;
  remark?: string;
}

export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  grossAmount?: number;
  netAmount?: number;
  taxAmount?: number;
  currency?: string;
  status?: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id?: string;
  paymentNumber?: string;
  paymentDate?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: "TRANSFER" | "CASH" | "CHECK" | "CREDIT_CARD";
  status?: "PENDING" | "SUCCESSFUL" | "FAILED";
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
  grossAmount?: number;
  netAmount?: number;
  taxAmount?: number;
  currency?: string;
  status?: "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface Quotation {
  id?: string;
  title?: string;
  introduction?: string;
  remark?: string;
  voucherDate?: string;
  expiryDate?: string;
  address?: {
    contactId?: string;
    name?: string;
    supplement?: string;
    street?: string;
    city?: string;
    zip?: string;
    countryCode?: string;
  };
  lineItems?: Array<{
    id?: string | null;
    type?: "custom" | "text";
    name?: string;
    description?: string | null;
    quantity?: number;
    unitName?: string;
    unitPrice?: {
      currency?: string;
      netAmount?: number;
      grossAmount?: number;
      taxRatePercentage?: number;
    };
    discountPercentage?: number;
    lineItemAmount?: number;
  }>;
  totalPrice?: {
    currency?: string;
    totalNetAmount?: number;
    totalGrossAmount?: number;
    totalTaxAmount?: number;
    totalDiscountAbsolute?: number;
    totalDiscountPercentage?: number;
  };
  taxConditions?: {
    taxType?: "net" | "gross";
    taxTypeNote?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  details?: any;
}
