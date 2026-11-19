import { Resend } from "resend";

export interface OrderEmailData {
  email: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  codFee: number;
  total: number;
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

// Created only when a key is configured so builds and local dev work without one.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for safe interpolation into HTML (element content and attribute values). */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

const money = (n: number) => `$${n.toFixed(2)}`;

export function orderUrl(orderId: string): string {
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/en/orders/${encodeURIComponent(orderId)}`;
}

export function renderOrderEmailHtml(data: OrderEmailData): string {
  const { orderId, items, subtotal, discount, shippingFee, tax, codFee, total } = data;

  const itemsList = items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} x${escapeHtml(item.quantity)} - ${money(item.price * item.quantity)}</li>`,
    )
    .join("");

  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding: 2px 0;">${bold ? "<strong>" : ""}${label}${bold ? "</strong>" : ""}</td>` +
    `<td style="padding: 2px 0; text-align: right;">${bold ? "<strong>" : ""}${value}${bold ? "</strong>" : ""}</td></tr>`;

  const breakdown = [
    row("Subtotal", money(subtotal)),
    discount > 0 ? row("Discount", `-${money(discount)}`) : "",
    row("Shipping", shippingFee > 0 ? money(shippingFee) : "Free"),
    row("Tax", money(tax)),
    codFee > 0 ? row("Cash on delivery fee", money(codFee)) : "",
    row("Total", money(total), true),
  ].join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Order Confirmed!</h1>
      <p>Thank you for your order!</p>

      <h2 style="color: #374151;">Order #${escapeHtml(orderId.slice(0, 8).toUpperCase())}</h2>

      <h3 style="color: #374151;">Order Details:</h3>
      <ul style="list-style: none; padding: 0;">
        ${itemsList}
      </ul>

      <table style="width: 100%; border-collapse: collapse;">${breakdown}</table>

      <h3 style="color: #374151;">Shipping Address:</h3>
      <p>
        ${escapeHtml(data.shippingAddress)}<br>
        ${escapeHtml(data.city)}, ${escapeHtml(data.state)} ${escapeHtml(data.zipCode)}
      </p>

      <p style="margin-top: 30px; color: #6B7280;">
        Track your order at: <a href="${escapeHtml(orderUrl(orderId))}">Your Orders</a>
      </p>

      <p style="margin-top: 30px; color: #6B7280;">
        Thank you for shopping with us!
      </p>
    </div>
  `.trim();
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  if (!resend) {
    console.info("RESEND_API_KEY not set; skipping order confirmation email");
    return false;
  }

  try {
    await resend.emails.send({
      from: "Shop <onboarding@resend.dev>",
      to: data.email,
      subject: `Order Confirmation - #${data.orderId.slice(0, 8).toUpperCase()}`,
      html: renderOrderEmailHtml(data),
    });
    console.log("Order confirmation email sent for order", data.orderId);
    return true;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    return false;
  }
}
