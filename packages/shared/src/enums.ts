// ─────────────────────────────────────────────
// User & Tenant
// ─────────────────────────────────────────────
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  OUTLET_MANAGER = 'OUTLET_MANAGER',
  BILLING_CLERK = 'BILLING_CLERK',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
}

export enum TenantPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

// ─────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────
export enum TableStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  BLOCKED = 'BLOCKED',
}

// ─────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────
export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  BILLED = 'BILLED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export enum OrderSource {
  POS = 'POS',
  ZOMATO = 'ZOMATO',
  SWIGGY = 'SWIGGY',
  WEBSITE = 'WEBSITE',
}

export enum KotItemStatus {
  PENDING = 'PENDING',
  SENT_TO_KOT = 'SENT_TO_KOT',
  PREPARED = 'PREPARED',
  DISPATCHED = 'DISPATCHED',
}

// ─────────────────────────────────────────────
// KOT
// ─────────────────────────────────────────────
export enum KotStatus {
  OPEN = 'OPEN',
  PREPARING = 'PREPARING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────
export enum InventoryUnit {
  GRAMS = 'GRAMS',
  ML = 'ML',
  PIECES = 'PIECES',
  KG = 'KG',
  LITRE = 'LITRE',
}

export enum StockTransactionType {
  DEDUCTION = 'DEDUCTION',
  RESTOCK = 'RESTOCK',
  ADJUSTMENT = 'ADJUSTMENT',
}

// ─────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────
export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  WALLET = 'WALLET',
  CREDIT = 'CREDIT',
}

// ─────────────────────────────────────────────
// Aggregators
// ─────────────────────────────────────────────
export enum AggregatorPlatform {
  ZOMATO = 'ZOMATO',
  SWIGGY = 'SWIGGY',
  DUNZO = 'DUNZO',
}
