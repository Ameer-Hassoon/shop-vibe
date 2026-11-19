import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeOrderTotals, type PricingCoupon } from "@/lib/pricing";
import type { CreateOrderInput } from "@/lib/validation";

export type OrderErrorCode =
  | "VALIDATION"
  | "PRODUCT_NOT_FOUND"
  | "OUT_OF_STOCK"
  | "COUPON_INVALID";

const STATUS_BY_CODE: Record<OrderErrorCode, number> = {
  VALIDATION: 400,
  PRODUCT_NOT_FOUND: 400,
  OUT_OF_STOCK: 409,
  COUPON_INVALID: 400,
};

/** Expected business-rule failure; the route turns it into `{ error, code }`. */
export class OrderError extends Error {
  readonly status: number;
  constructor(
    readonly code: OrderErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "OrderError";
    this.status = STATUS_BY_CODE[code];
  }
}

const MAX_QUANTITY_PER_PRODUCT = 99;

/** Checks everything about a coupon that can be decided from its row and the subtotal. */
export function assertCouponUsable(
  coupon: {
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
    usageLimit: number | null;
    usageCount: number;
    minPurchase: number;
  } | null,
  subtotal: number,
  now = new Date(),
) {
  if (!coupon) throw new OrderError("COUPON_INVALID", "Invalid coupon code");
  if (!coupon.isActive || now < coupon.validFrom || now > coupon.validUntil) {
    throw new OrderError("COUPON_INVALID", "This coupon is no longer valid");
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new OrderError("COUPON_INVALID", "This coupon has reached its usage limit");
  }
  if (subtotal < coupon.minPurchase) {
    throw new OrderError(
      "COUPON_INVALID",
      `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required`,
    );
  }
}

function mergeItems(items: CreateOrderInput["items"]) {
  const merged = new Map<string, number>();
  for (const { productId, quantity } of items) {
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }
  for (const [productId, quantity] of merged) {
    if (quantity > MAX_QUANTITY_PER_PRODUCT) {
      throw new OrderError(
        "VALIDATION",
        `Quantity per product must be at most ${MAX_QUANTITY_PER_PRODUCT}`,
        { items: `Product ${productId}: quantity must be at most ${MAX_QUANTITY_PER_PRODUCT}` },
      );
    }
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

const orderInclude = {
  items: { include: { product: true } },
  coupon: true,
} satisfies Prisma.OrderInclude;

/**
 * Creates an order for `userId` from an already schema-validated `input`.
 *
 * Everything runs in one transaction, so a failure (out of stock, exhausted coupon)
 * leaves stock and coupon usage untouched. Prices and totals are always computed
 * server-side from the database. Stock and coupon usage are claimed with conditional
 * `updateMany` statements (compare-and-decrement), so concurrent orders can neither
 * oversell a product nor exceed a coupon's usage limit.
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  const lines = mergeItems(input.items);

  let attempts = 0;
  for (;;) {
    try {
      const order = await prisma.$transaction(
        async (tx) => {
          const products = await tx.product.findMany({
            where: { id: { in: lines.map((l) => l.productId) } },
          });
          const productById = new Map(products.map((p) => [p.id, p]));

          const priced = lines.map((line) => {
            const product = productById.get(line.productId);
            if (!product) {
              throw new OrderError("PRODUCT_NOT_FOUND", "Product not found", {
                items: `Unknown product: ${line.productId}`,
              });
            }
            return { ...line, price: product.price };
          });

          const subtotal = computeOrderTotals(priced).subtotal;

          let coupon: Prisma.CouponGetPayload<object> | null = null;
          if (input.couponCode) {
            coupon = await tx.coupon.findUnique({ where: { code: input.couponCode } });
            assertCouponUsable(coupon, subtotal);
            const claimed = await tx.coupon.updateMany({
              where: {
                id: coupon!.id,
                isActive: true,
                // compare-and-increment: fails if a concurrent order took the last use
                ...(coupon!.usageLimit != null
                  ? { usageCount: { lt: coupon!.usageLimit } }
                  : {}),
              },
              data: { usageCount: { increment: 1 } },
            });
            if (claimed.count === 0) {
              throw new OrderError("COUPON_INVALID", "This coupon has reached its usage limit");
            }
          }

          const totals = computeOrderTotals(priced, {
            coupon: coupon as PricingCoupon | null,
            paymentMethod: input.paymentMethod,
          });

          for (const line of priced) {
            const updated = await tx.product.updateMany({
              where: { id: line.productId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });
            if (updated.count === 0) {
              const fresh = await tx.product.findUnique({ where: { id: line.productId } });
              if (!fresh) {
                throw new OrderError("PRODUCT_NOT_FOUND", "Product not found");
              }
              throw new OrderError(
                "OUT_OF_STOCK",
                `Insufficient stock for ${fresh.name}. Only ${fresh.stock} available.`,
                { items: `${fresh.name}: only ${fresh.stock} available` },
              );
            }
          }

          return tx.order.create({
            data: {
              userId,
              status: "PENDING",
              paymentMethod: input.paymentMethod,
              phone: input.phone,
              shippingAddress: input.shippingAddress,
              city: input.city,
              state: input.state,
              zipCode: input.zipCode,
              subtotal: totals.subtotal,
              discountAmount: totals.discount,
              shippingFee: totals.shipping,
              tax: totals.tax,
              codFee: totals.codFee,
              total: totals.total,
              couponId: coupon?.id ?? null,
              items: {
                create: priced.map((l) => ({
                  productId: l.productId,
                  quantity: l.quantity,
                  price: l.price,
                })),
              },
            },
            include: orderInclude,
          });
        },
        { maxWait: 10_000, timeout: 15_000 },
      );

      await linkViewsToOrderItems(userId, order.items).catch((err) =>
        console.error("Failed to link views to order items:", err),
      );
      return order;
    } catch (err) {
      // SQLite reports write contention as P2034; the transaction rolled back, so retry.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034" &&
        ++attempts < 4
      ) {
        await new Promise((r) => setTimeout(r, 25 * attempts));
        continue;
      }
      throw err;
    }
  }
}

/** Attributes the user's recent product views (last 7 days) to the order items they led to. */
export async function linkViewsToOrderItems(
  userId: string,
  orderItems: { id: string; productId: string }[],
) {
  if (orderItems.length === 0) return;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await Promise.all(
    orderItems.map((item) =>
      prisma.productView.updateMany({
        where: {
          userId,
          productId: item.productId,
          orderItemId: null,
          createdAt: { gte: since },
        },
        data: { orderItemId: item.id },
      }),
    ),
  );
}

export type CreatedOrder = Awaited<ReturnType<typeof createOrder>>;
