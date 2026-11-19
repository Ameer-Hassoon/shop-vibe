/**
 * Order status workflow, shared by the admin UI (which only offers these moves) and the API
 * (which enforces them). Kept free of server imports so client components can use it.
 */
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Forward-only moves. DELIVERED and CANCELLED are final. */
export const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (ORDER_STATUSES as readonly unknown[]).includes(value);
}

/** True when `from` may move to `to`. Staying on the same status is always allowed. */
export function canTransition(from: string, to: string): boolean {
  if (from === to) return true;
  return isOrderStatus(from) && NEXT_STATUSES[from].includes(to as OrderStatus);
}
