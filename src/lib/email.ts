import { Resend } from 'resend';

interface OrderEmailData {
  email: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

// Created lazily so builds and local dev work without an API key; emails are skipped then.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const { email, orderId, items, total, shippingAddress, city, state, zipCode } = data;

  const itemsList = items
    .map((item) => `<li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`)
    .join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Order Confirmed!</h1>
      <p>Thank you for your order!</p>
      
      <h2 style="color: #374151;">Order #${orderId.slice(0, 8).toUpperCase()}</h2>
      
      <h3 style="color: #374151;">Order Details:</h3>
      <ul style="list-style: none; padding: 0;">
        ${itemsList}
      </ul>
      
      <p><strong>Total: $${total.toFixed(2)}</strong></p>
      
      <h3 style="color: #374151;">Shipping Address:</h3>
      <p>
        ${shippingAddress}<br>
        ${city}, ${state} ${zipCode}
      </p>
      
      <p style="margin-top: 30px; color: #6B7280;">
        Track your order at: <a href="http://localhost:3000/orders">Your Orders</a>
      </p>
      
      <p style="margin-top: 30px; color: #6B7280;">
        Thank you for shopping with us!
      </p>
    </div>
  `.trim();

  if (!resend) {
    console.info('RESEND_API_KEY not set; skipping order confirmation email');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'Shop <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });
    console.log('✅ Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}
