import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// EMAIL 1: To BUYER (with Reply-To set to seller)
export async function sendBuyerOrderEmail(orderData: {
  to: string;
  customer_name: string;
  order_number: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price_at_time: number;
  }>;
  subtotal: number;
  seller_name: string;
  seller_email: string;
  seller_phone: string;
}) {
  const { 
    to, 
    customer_name, 
    order_number, 
    items, 
    subtotal, 
    seller_name, 
    seller_email, 
    seller_phone 
  } = orderData;
  
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; color: #374151;">${item.product_name}</td>
      <td style="padding: 12px 8px; text-align: center; color: #374151;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #374151;">KSh ${item.price_at_time.toLocaleString()}</td>
      <td style="padding: 12px 8px; text-align: right; color: #111827; font-weight: 600;">KSh ${(item.price_at_time * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation #${order_number}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">Order Confirmation</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Order #${order_number}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">Hello ${customer_name},</p>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Thank you for your order! Your order has been received and will be processed.
            </p>
            
            <!-- Order Summary -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #e5e7eb;">
                    <th style="text-align: left; padding: 8px 8px; color: #6b7280; font-weight: 600;">Product</th>
                    <th style="text-align: center; padding: 8px 8px; color: #6b7280; font-weight: 600;">Qty</th>
                    <th style="text-align: right; padding: 8px 8px; color: #6b7280; font-weight: 600;">Price</th>
                    <th style="text-align: right; padding: 8px 8px; color: #6b7280; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600; color: #111827;">Grand Total:</td>
                    <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #4F46E5; font-size: 18px;">KSh ${subtotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <!-- Seller Contact Info -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #92400e;">Contact Seller for Delivery</h3>
              <p style="margin: 0 0 8px 0; color: #78350f;">
                <strong>Seller:</strong> ${seller_name}<br>
                <strong>Phone:</strong> ${seller_phone}<br>
                <strong>Email:</strong> ${seller_email}
              </p>
              <p style="margin: 12px 0 0 0; color: #78350f; font-size: 14px;">
                The seller will contact you regarding delivery fees. You can also reach out to them directly.
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 24px 0 16px 0;">
              Your order will be processed once delivery is arranged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Thank you for shopping with Paziatech!
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    replyTo: seller_email,  // ← Replies go to seller
    to: to,
    subject: `Order Confirmation #${order_number}`,
    html,
  });
}

// EMAIL 2: To SELLER
export async function sendSellerOrderEmail(orderData: {
  to: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  order_number: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price_at_time: number;
  }>;
  subtotal: number;
  special_instructions?: string;
  payment_method: string;
}) {
  const { 
    to, 
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_address, 
    order_number, 
    items, 
    subtotal, 
    special_instructions,
    payment_method 
  } = orderData;
  
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; color: #374151;">${item.product_name}</td>
      <td style="padding: 12px 8px; text-align: center; color: #374151;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #374151;">KSh ${item.price_at_time.toLocaleString()}</td>
      <td style="padding: 12px 8px; text-align: right; color: #111827; font-weight: 600;">KSh ${(item.price_at_time * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');
  
  const paymentMethodText = payment_method === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order #${order_number}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">New Order Alert!</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Order #${order_number}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <!-- Customer Info -->
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #065f46;">Customer Details</h3>
              <p style="margin: 0 0 4px 0; color: #065f46;"><strong>Name:</strong> ${customer_name}</p>
              <p style="margin: 0 0 4px 0; color: #065f46;"><strong>Phone:</strong> ${customer_phone}</p>
              <p style="margin: 0 0 4px 0; color: #065f46;"><strong>Email:</strong> ${customer_email}</p>
              <p style="margin: 0; color: #065f46;"><strong>Address:</strong> ${customer_address}</p>
            </div>
            
            <!-- Order Summary -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #e5e7eb;">
                    <th style="text-align: left; padding: 8px 8px; color: #6b7280; font-weight: 600;">Product</th>
                    <th style="text-align: center; padding: 8px 8px; color: #6b7280; font-weight: 600;">Qty</th>
                    <th style="text-align: right; padding: 8px 8px; color: #6b7280; font-weight: 600;">Price</th>
                    <th style="text-align: right; padding: 8px 8px; color: #6b7280; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600; color: #111827;">Grand Total:</td>
                    <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #10b981; font-size: 18px;">KSh ${subtotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <!-- Additional Info -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; color: #78350f;"><strong>Payment Method:</strong> ${paymentMethodText}</p>
              ${special_instructions ? `<p style="margin: 0; color: #78350f;"><strong>Special Instructions:</strong> ${special_instructions}</p>` : ''}
            </div>
            
            <!-- Action Required -->
            <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Action Required:</strong><br>
                Contact customer to arrange delivery fees and confirm delivery date.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Login to your dashboard to manage this order.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    to: to,
    subject: `New Order #${order_number}`,
    html,
  });
}