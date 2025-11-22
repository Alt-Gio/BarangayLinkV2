import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      attendeeId,
      attendeeName,
      attendeeEmail,
      eventTitle,
      customMessage,
      ticketCode,
      eventDate,
      eventLocation,
    } = body;

    if (!attendeeEmail || !eventTitle || !ticketCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate QR Code
    let base64QRData = "";
    let base64BarcodeData = "";

    try {
      const qrDataURL = await QRCode.toDataURL(ticketCode, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      base64QRData = qrDataURL.replace(/^data:image\/png;base64,/, "");
      console.log("QR code generated successfully");
    } catch (qrError) {
      console.error("QR generation error:", qrError);
      throw new Error("Failed to generate QR code");
    }

    // Generate Barcode (simplified - skip if canvas not available)
    try {
      const { createCanvas } = await import("canvas");
      const canvas = createCanvas(350, 100);
      JsBarcode(canvas, ticketCode, {
        format: "CODE39", // Better for short alphanumeric codes
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 16,
        margin: 8,
        textMargin: 5,
      });
      const barcodeDataURL = canvas.toDataURL("image/png");
      base64BarcodeData = barcodeDataURL.replace(/^data:image\/png;base64,/, "");
      console.log("Barcode generated successfully");
    } catch (barcodeError) {
      console.warn("Barcode generation skipped (canvas not available):", barcodeError);
      // Continue without barcode - QR code is enough
    }

    const { data, error } = await resend.emails.send({
      from: "BarangayLink <noreply@barangaylink.com>",
      to: [attendeeEmail],
      subject: `🎉 You're Invited: ${eventTitle}`,
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
              .custom-message {
                background: #e0f2fe;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #0ea5e9;
                margin: 20px 0;
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
              <h1>🎉 You're Invited!</h1>
              <p style="margin: 0;">Join us for an amazing event</p>
            </div>
            
            <div class="content">
              <h2 style="color: #10b981; margin-top: 0;">Hi ${attendeeName || "there"}! 👋</h2>
              
              <p>You've been invited to attend <strong>${eventTitle}</strong>!</p>
              
              ${eventDate ? `<p><strong>📅 Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>` : ''}
              ${eventLocation ? `<p><strong>📍 Location:</strong> ${eventLocation}</p>` : ''}
              
              ${customMessage ? `
                <div class="custom-message">
                  <p style="margin: 0;"><strong>📝 Message from organizer:</strong></p>
                  <p style="margin: 10px 0 0 0;">${customMessage}</p>
                </div>
              ` : ''}
              
              <div class="qr-container">
                <h3 style="margin-top: 0; color: #1f2937;">📱 Your Ticket</h3>
                <p style="color: #6b7280;">Show this at the event entrance for quick check-in</p>
                
                <img src="cid:qrcode" alt="QR Code" style="max-width: 250px; height: auto; margin: 10px 0;" />
                
                ${base64BarcodeData ? `
                  <div style="margin: 20px 0; padding: 20px 0; border-top: 2px dashed #e5e7eb;">
                    <h4 style="color: #4b5563; margin-bottom: 10px;">📊 Alternative: Barcode</h4>
                    <img src="cid:barcode" alt="Barcode" style="max-width: 350px; height: auto;" />
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">
                      Use either QR code or barcode - both work!
                    </p>
                  </div>
                ` : ''}
                
                <div class="ticket-code">${ticketCode}</div>
                <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
                  Your unique ticket code
                </p>
              </div>
              
              <div class="instructions">
                <h3 style="margin-top: 0; color: #1e40af;">✅ How to Check In:</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Bring this email</strong> (on your phone or printed)</li>
                  <li><strong>Show your QR code or barcode</strong> at the entrance</li>
                  <li><strong>Scan automatically</strong> with our scanner</li>
                  <li><strong>You're in!</strong> - Enjoy the event! 🎉</li>
                </ol>
                <p style="margin-bottom: 0; font-size: 14px;">
                  <strong>💡 Tip:</strong> Save this QR code to your phone for easy access!
                </p>
              </div>
              
              <p style="margin-top: 30px;">
                We're excited to see you there! If you have any questions, feel free to reach out.
              </p>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/events" class="button">
                  View Event Details
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>
                Questions? Contact us at support@barangaylink.com<br>
                <small>This is an automated invitation. Please do not reply to this email.</small>
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
    console.error("Invitation email error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
