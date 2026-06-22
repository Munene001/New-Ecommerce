import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactEmailProps {
  name: string;
  phone: string;
  email: string;
  message: string;
}

export async function sendContactEmail({ name, phone, email, message }: ContactEmailProps) {
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://paziatech.co.ke'}/logo.png`;

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f97316; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
        .logo { max-width: 80px; margin-bottom: 10px; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #f97316; margin-bottom: 5px; display: block; }
        .value { background: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="PaziaTech Logo" class="logo" style="max-width: 80px;">
          <h2>📬 New Contact Form Submission</h2>
          <p>Pazia Tech</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">👤 Name</div>
            <div class="value">${name}</div>
          </div>
          <div class="field">
            <div class="label">📞 Phone</div>
            <div class="value">${phone}</div>
          </div>
          <div class="field">
            <div class="label">✉️ Email</div>
            <div class="value">${email}</div>
          </div>
          <div class="field">
            <div class="label">💬 Message</div>
            <div class="value">${message.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        <div class="footer">
          <p>Sent from Pazia Tech Contact Form</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: `PaziaTech <noreply@paziatech.co.ke>`,
    to:"hello@mail.paziatech.co.ke",
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`,
    html: emailContent,
  });
}