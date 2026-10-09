import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://paziatech.co.ke';
const logoUrl = `${baseUrl}/logo.png`;

interface WelcomeEmailParams {
  email: string;
  businessName: string;
  fullName: string;
  businessSlug: string;
}

export async function sendWelcomeEmail({ email, businessName, fullName, businessSlug }: WelcomeEmailParams) {
  const dashboardUrl = `${baseUrl}/dashboard/${businessSlug}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome to PaziaTech</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 500px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Header: black with darker orange title -->
        <div style="background-color: #000000; padding: 24px 20px; text-align: center;">
          <img src="${logoUrl}" alt="PaziaTech" style="max-width: 80px; margin-bottom: 12px;">
          <h1 style="color: #ea580c; margin: 0; font-size: 26px; font-weight: 700;">Welcome to PaziaTech</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <div style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px;">
            🎉 Hi ${fullName},
          </div>
          <div style="color: #111827; line-height: 1.5; margin-bottom: 28px; font-size: 16px;">
            Your shop <strong style="color: #ea580c; font-weight: 700;">${businessName}</strong> is now live and ready to sell.
          </div>
          
          <!-- Darker orange button -->
          <div style="text-align: center; margin: 12px 0 8px;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 600; font-size: 16px;">➕ Add Your First Product</a>
          </div>
          
          <!-- Dashboard link -->
          <div style="font-size: 14px; color: #4b5563; word-break: break-all; margin-top: 20px;">
            Dashboard: <a href="${dashboardUrl}" style="color: #ea580c; text-decoration: none;">${dashboardUrl}</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;">
          
          <!-- Contact section -->
          <div style="font-size: 15px; color: #111827; text-align: center;">
            Need help? Reach out to us:
          </div>
          <div style="margin: 16px 0; text-align: center;">
            <a href="tel:+254715067768" style="color: #ea580c; text-decoration: none; font-weight: 600; margin: 0 8px; font-size: 16px;">📞 0715 067 768</a>
            <span style="color: #d1d5db;">|</span>
            <a href="tel:+254706340032" style="color: #ea580c; text-decoration: none; font-weight: 600; margin: 0 8px; font-size: 16px;">📞 0706 340 032</a>
          </div>
          <div style="font-size: 14px; color: #4b5563; text-align: center; margin-bottom: 16px;">
            Call or WhatsApp (Mon–Sat, 9am–6pm)
          </div>
        </div>
        
        <!-- Footer -->
        <div style="font-size: 13px; color: #6b7280; text-align: center; padding: 0 24px 32px;">
          © PaziaTech · Start selling in minutes
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: `PaziaTech <welcome@paziatech.co.ke>`,
    to: email,
    subject: `🎉 ${businessName} is live – add your first product`,
    html,
  });
}