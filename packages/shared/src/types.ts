import type { Role, TenantPlan, OrderStatus, OrderType, OrderSource } from './enums';

// ─────────────────────────────────────────────
// JWT Payload
// ─────────────────────────────────────────────
export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  outletId: string | null;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// Request augmentation (used on Express req.user)
// ─────────────────────────────────────────────
export interface AuthUser {
  userId: string;
  tenantId: string;
  outletId: string | null;
  role: Role;
}

// ─────────────────────────────────────────────
// Token pair
// ─────────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// Outlet settings (stored as JSON column)
// ─────────────────────────────────────────────
export interface OutletSettings {
  taxRate?: number;            // percentage, e.g. 5 or 18
  serviceChargeRate?: number;
  currency?: string;           // 'INR' | 'USD' etc.
  timezone?: string;
  printLogoUrl?: string;
  receiptFooter?: string;
  kotPrinterIp?: string;
}

// ─────────────────────────────────────────────
// Low-stock alert payload
// ─────────────────────────────────────────────
export interface LowStockAlert {
  inventoryItemId: string;
  itemName: string;
  currentQuantity: number;
  threshold: number;
  unit: string;
  outletId: string;
}

// ─────────────────────────────────────────────
// Aggregator order (normalised internal format)
// ─────────────────────────────────────────────
export interface NormalizedAggregatorOrder {
  externalOrderId: string;
  platform: string;
  outletId: string;
  orderType: OrderType;
  source: OrderSource;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    externalItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  notes?: string;
}
