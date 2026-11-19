export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; image: string; price?: number; stock?: number } | null;
}

export interface AdminOrder {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string | null;
  paymentMethod?: string | null;
  subtotal?: number | null;
  shippingFee?: number | null;
  tax?: number | null;
  codFee?: number | null;
  discountAmount?: number | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  user: { id?: string; name: string | null; email: string } | null;
  items: AdminOrderItem[];
  coupon?: { code: string; type?: string; value?: number } | null;
}

/** Re-exported for the admin UI; see src/lib/categories.ts. */
export { CATEGORIES as PRODUCT_CATEGORIES } from "@/lib/categories";
