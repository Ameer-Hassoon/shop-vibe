import { NextResponse } from "next/server";
import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orderStatus";

export { ORDER_STATUSES };

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const trimmed = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

/** Accepts a number or a numeric string (admin forms post strings). */
const numberLike = (label: string) =>
  z
    .union([z.number(), z.string().trim().min(1)], {
      error: `${label} must be a number`,
    })
    .transform((v) => (typeof v === "number" ? v : Number(v)))
    .pipe(z.number({ error: `${label} must be a number` }).finite(`${label} must be a number`));

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format");

const imageField = z
  .string({ error: "Image URL is required" })
  .trim()
  .min(1, "Image URL is required")
  .max(2000, "Image URL is too long")
  .refine((v) => /^https?:\/\//i.test(v) || v.startsWith("/"), "Image must be an http(s) URL or a /path");

// ---------------------------------------------------------------------------
// schemas
// ---------------------------------------------------------------------------

export const orderItemSchema = z.object({
  productId: trimmed("Product", 100),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity must be at most 99"),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema, { error: "Items are required" })
    .min(1, "Order must contain at least one item")
    .max(50, "Order can contain at most 50 items"),
  shippingAddress: trimmed("Address", 200),
  city: trimmed("City", 100),
  state: trimmed("State", 100),
  zipCode: trimmed("ZIP code", 20),
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .min(7, "Phone must be 7-20 characters")
    .max(20, "Phone must be 7-20 characters")
    .regex(/^[0-9 +-]+$/, "Phone may only contain digits, spaces, + and -"),
  couponCode: z
    .string()
    .trim()
    .max(50, "Coupon code is too long")
    .optional()
    .nullable()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  paymentMethod: z
    .literal("cod", { error: 'Payment method must be "cod"' })
    .default("cod"),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const registerSchema = z.object({
  name: z.string().trim().max(100, "Name is too long").optional().nullable(),
  email: emailField,
  // bcrypt only hashes the first 72 bytes
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const productCreateSchema = z.object({
  name: trimmed("Name", 200),
  description: trimmed("Description", 5000),
  price: numberLike("Price").pipe(
    z.number().min(0, "Price cannot be negative").max(1_000_000, "Price is too large"),
  ),
  image: imageField,
  category: trimmed("Category", 100),
  stock: numberLike("Stock").pipe(
    z.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(1_000_000, "Stock is too large"),
  ),
});

export const productUpdateSchema = productCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

const reviewFields = {
  rating: z
    .number({ error: "Rating must be a number" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  title: z
    .string()
    .trim()
    .max(100, "Title must be at most 100 characters")
    .optional()
    .nullable()
    .transform((v) => v || null),
  content: z
    .string({ error: "Review content is required" })
    .trim()
    .min(10, "Review content must be at least 10 characters")
    .max(2000, "Review content must be at most 2000 characters"),
};

export const reviewCreateSchema = z.object(reviewFields);
export const reviewUpdateSchema = z.object({
  reviewId: trimmed("Review ID", 100),
  ...reviewFields,
});

export const newsletterSchema = z.object({ email: emailField });

export const productIdSchema = z.object({ productId: trimmed("Product ID", 100) });

export const searchHistorySchema = z.object({ query: trimmed("Query", 200) });

export const adminOrderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: "Invalid status" }).optional(),
  trackingNumber: z.string().trim().max(100).nullable().optional(),
  carrier: z.string().trim().max(100).nullable().optional(),
  estimatedDelivery: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid estimated delivery date")
    .nullable()
    .optional(),
  restoreStock: z.boolean().optional(),
});
export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;

// ---------------------------------------------------------------------------
// request helpers
// ---------------------------------------------------------------------------

export type FieldErrors = Record<string, string>;

export function validationResponse(fields: FieldErrors, error?: string) {
  return NextResponse.json(
    {
      error: error ?? Object.values(fields)[0] ?? "Invalid request",
      code: "VALIDATION",
      fields,
    },
    { status: 400 },
  );
}

export function zodFields(err: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

export type ParseResult<T> =
  | { data: T; response: null }
  | { data: null; response: NextResponse };

/** Validates already-parsed data. */
export function parseWith<S extends z.ZodType>(
  schema: S,
  data: unknown,
): ParseResult<z.output<S>> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { data: null, response: validationResponse(zodFields(result.error)) };
  }
  return { data: result.data, response: null };
}

/** Reads the JSON body and validates it; malformed JSON is a VALIDATION error too. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.output<S>>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      data: null,
      response: validationResponse({ _: "Request body must be valid JSON" }),
    };
  }
  return parseWith(schema, json);
}
