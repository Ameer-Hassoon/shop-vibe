export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemDto {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; image: string } | null;
}

export interface OrderDto {
  id: string;
  status: string;
  subtotal?: number | null;
  discountAmount?: number | null;
  shippingFee?: number | null;
  tax?: number | null;
  codFee?: number | null;
  total: number;
  paymentMethod?: string | null;
  phone?: string | null;
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  coupon?: { code: string } | null;
  items: OrderItemDto[];
}

export type BadgeTone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

export const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "brand",
  PROCESSING: "brand",
  SHIPPED: "accent",
  DELIVERED: "success",
  CANCELLED: "danger",
};

/** Short order reference shown to humans (the id is a long UUID). */
export function orderNumber(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function itemCount(order: OrderDto): number {
  return order.items.reduce((n, i) => n + i.quantity, 0);
}

/** Amounts to display. Older orders stored subtotal = 0, so fall back to summing the items. */
export function orderBreakdown(order: OrderDto) {
  const itemsSum = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = order.subtotal ? order.subtotal : itemsSum;
  return {
    subtotal,
    discount: order.discountAmount ?? 0,
    shipping: order.shippingFee ?? 0,
    tax: order.tax ?? 0,
    codFee: order.codFee ?? 0,
    total: order.total,
  };
}
