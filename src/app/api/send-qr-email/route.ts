import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendeeName, attendeeEmail, eventTitle, ticketCode, qrDataURL, barcodeDataURL } = body;

    if (!attendeeEmail || !eventTitle || !ticketCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert base64 QR code to attachment
    const base64QRData = qrDataURL.replace(/^data:image\/png;base64,/, "");
    const base64BarcodeData = barcodeDataURL ? barcodeDataURL.replace(/^data:image\/png;base64,/, "") : null;

    const { data, error } = await resend.emails.send({
      from: "BarangayLink <noreply@barangaylink.com>",
      to: [attendeeEmail],
      subject: `📅 Event Ticket: ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .qr-container {
                background: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .ticket-code {
                background: #10b981;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                display: inline-block;
                font-family: monospace;
                font-size: 18px;
                margin-top: 10px;
              }
              .instructions {
                background: #dbeafe;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #3b82f6;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #6b7280;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎫 Your Event Ticket</h1>
              <p style="margin: 0;">You're invited to attend</p>
            </div>
            
            <div class="content">
              <h2 style="color: #10b981; margin-top: 0;">Hi ${attendeeName || "Attendee"}! 👋</h2>
              
              <p>You're all set for <strong>${eventTitle}</strong>!</p>
              
              <div class="qr-container">
                <h3 style="margin-top: 0; color: #1f2937;">📱 Your QR Code Ticket</h3>
                <img src="cid:qrcode" alt="QR Code" style="max-width: 250px; height: auto;" />
                <div class="ticket-code">${ticketCode}</div>
                <p style="font-size: 14px; color: #6b7280; margin: 10px 0;">
                  Save this QR code or bring this email to the event
                </p>
                ${base64BarcodeData ? `
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
                    <h4 style="color: #4b5563; margin-bottom: 10px;">📊 Alternative: Barcode Format</h4>
                    <img src="cid:barcode" alt="Barcode" style="max-width: 350px; height: auto;" />
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">
                      Use either QR code or barcode - both work!
                    </p>
                  </div>
                ` : ''}
              </div>
              
              <div class="instructions">
                <h3 style="margin-top: 0; color: #1e40af;">✅ How to Check In:</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Show this QR code</strong> at the event entrance</li>
                  <li><strong>Scan automatically</strong> with our barcode scanner</li>
                  <li><strong>Get confirmed</strong> - you're checked in! 🎉</li>
                </ol>
                <p style="margin-bottom: 0; font-size: 14px;">
                  <strong>💡 Tip:</strong> You can also save this image to your phone or print it out.
                </p>
              </div>
              
              <p style="margin-top: 20px;">
                <strong>Event:</strong> ${eventTitle}<br>
                <strong>Ticket Code:</strong> <code>${ticketCode}</code>
              </p>
              
              <p>See you there! 🎊</p>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/events" class="button">
                  View Event Details
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>
                Questions? Contact us at support@barangaylink.com<br>
                <small>This is an automated email. Please do not reply.</small>
              </p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: base64QRData,
          contentId: "qrcode",
        },
        ...(base64BarcodeData ? [{
          filename: "barcode.png",
          content: base64BarcodeData,
          contentId: "barcode",
        }] : []),
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
