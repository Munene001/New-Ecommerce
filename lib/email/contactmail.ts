import nodemailer from 'nodemailer';

// Use same SMTP config as your orders
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ContactEmailProps {
  name: string;
  phone: string;
  email: string;
  message: string;
}

export async function sendContactEmail({ name, phone, email, message }: ContactEmailProps) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f97316; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_FROM,
    replyTo: email, // So you can reply directly to the customer
    subject: `New Contact Form Submission from ${name}`,
    text: `
      Name: ${name}
      Phone: ${phone}
      Email: ${email}
      Message: ${message}
    `,
    html: emailContent,
  });
}