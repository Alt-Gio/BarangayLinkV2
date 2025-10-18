import { NextResponse } from 'next/server';

export async function GET() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    return NextResponse.json({
      status: 'error',
      message: '❌ RESEND_API_KEY not found in environment variables',
      hint: 'Add RESEND_API_KEY=re_your_key to .env.local'
    });
  }

  if (!RESEND_API_KEY.startsWith('re_')) {
    return NextResponse.json({
      status: 'error',
      message: '❌ Invalid RESEND_API_KEY format',
      hint: 'API key should start with "re_"'
    });
  }

  return NextResponse.json({
    status: 'success',
    message: '✅ Resend API key is configured!',
    keyPreview: RESEND_API_KEY.substring(0, 10) + '...',
    ready: true
  });
}

export async function POST(request: Request) {
  const { email } = await request.json();
  
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BarangayLink <onboarding@resend.dev>',
        to: [email],
        subject: '🧪 Test Email from BarangayLink V2',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #10b981; margin-top: 0;">✅ Email System Working!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Congratulations! Your Resend email integration is working perfectly.
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                This is a test email from your BarangayLink V2 application.
              </p>
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #065f46; font-weight: 600;">
                  ✨ Your invitation system is ready to use!
                </p>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="font-size: 14px; color: #6b7280;">
                BarangayLink V2 - Community Management System
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        status: 'success',
        message: '✅ Test email sent successfully!',
        emailId: data.id,
      });
    } else {
      console.error('Resend API Error:', data);
      return NextResponse.json({
        status: 'error',
        message: '❌ Failed to send email',
        error: data,
        errorDetails: {
          statusCode: response.status,
          message: data.message || data.error || 'Unknown error',
          hint: 'Check console for full error details'
        }
      }, { status: response.status });
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: '❌ Error sending email',
      error: error.message,
    }, { status: 500 });
  }
}
