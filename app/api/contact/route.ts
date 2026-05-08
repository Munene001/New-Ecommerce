import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email/contactmail';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, phone, email, message } = body;

  // Validate required fields
  if (!name || !phone || !email || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Validate phone (basic)
  if (phone.length < 10) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  try {
    // Send email (non-blocking - don't await)
    sendContactEmail({ name, phone, email, message }).catch(error => {
      console.error('Contact email failed:', error);
    });

    // Return success immediately
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully. We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}