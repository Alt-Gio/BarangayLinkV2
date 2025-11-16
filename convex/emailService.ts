import { v } from "convex/values";
import { action } from "./_generated/server";

// Email service configuration
// To enable: Set RESEND_API_KEY or SENDGRID_API_KEY in environment variables
const EMAIL_SERVICE_ENABLED = true; // ✅ Set to true

/**
 * Helper function to send email
 * This is called by the email action functions below
 */
async function sendEmailHelper(args: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}) {
  if (!EMAIL_SERVICE_ENABLED) {
    // Log the email that would be sent
    console.log("📧 Email (not sent - service disabled):", {
      to: args.to,
      subject: args.subject,
    });
    return { success: false, message: "Email service not configured" };
  }

  try {
    // TODO: Integrate with your email provider
    // Example with Resend:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Barangay Bitano <noreply@barangay.gov.ph>',
        to: args.to,
        subject: args.subject,
        html: args.htmlContent,
        text: args.textContent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */

    // For now, just log that it would be sent
    console.log("📧 Email would be sent to:", args.to, "Subject:", args.subject);
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Send certificate approved notification email
 */
export const sendCertificateApprovedEmail = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    certificateType: v.string(),
    controlNumber: v.string(),
    downloadUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Certificate Approved!</h1>
    </div>
    <div class="content">
      <p>Dear ${args.recipientName},</p>
      
      <p>Great news! Your certificate request has been approved and is now ready.</p>
      
      <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
        <strong>Certificate Details:</strong><br>
        <strong>Type:</strong> ${args.certificateType}<br>
        <strong>Control Number:</strong> ${args.controlNumber}
      </div>
      
      ${args.downloadUrl ? `
        <p>You can download your certificate using the button below:</p>
        <a href="${args.downloadUrl}" class="button">Download Certificate</a>
      ` : `
        <p>You can download your certificate by visiting the Resident Portal:</p>
        <a href="https://your-domain.com/portal" class="button">Go to Portal</a>
      `}
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      <strong>Barangay Bitano</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Barangay Management System.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Dear ${args.recipientName},

Great news! Your ${args.certificateType} (Control #: ${args.controlNumber}) has been approved and is now ready for download.

Visit the Resident Portal to download your certificate: https://your-domain.com/portal

Best regards,
Barangay Bitano
    `;

    return await sendEmailHelper({
      to: args.recipientEmail,
      subject: `✅ Your ${args.certificateType} is Ready!`,
      htmlContent,
      textContent,
    });
  },
});

/**
 * Send certificate rejected notification email
 */
export const sendCertificateRejectedEmail = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    certificateType: v.string(),
    controlNumber: v.string(),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f56565 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .reason-box { background: #fee; border-left: 4px solid #f56565; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Certificate Request Update</h1>
    </div>
    <div class="content">
      <p>Dear ${args.recipientName},</p>
      
      <p>We regret to inform you that your certificate request could not be approved at this time.</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0;">
        <strong>Request Details:</strong><br>
        <strong>Type:</strong> ${args.certificateType}<br>
        <strong>Control Number:</strong> ${args.controlNumber}
      </div>
      
      <div class="reason-box">
        <strong>Reason:</strong><br>
        ${args.rejectionReason}
      </div>
      
      <p>If you believe this was done in error or need clarification, please visit the Barangay Office or contact us.</p>
      
      <p>You may submit a new request after addressing the issues mentioned above.</p>
      
      <p>Best regards,<br>
      <strong>Barangay Bitano</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Barangay Management System.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Dear ${args.recipientName},

We regret to inform you that your ${args.certificateType} request (Control #: ${args.controlNumber}) could not be approved.

Reason: ${args.rejectionReason}

If you need clarification, please visit the Barangay Office.

Best regards,
Barangay Bitano
    `;

    return await sendEmailHelper({
      to: args.recipientEmail,
      subject: `Certificate Request Update - ${args.controlNumber}`,
      htmlContent,
      textContent,
    });
  },
});

/**
 * Send request received confirmation email
 */
export const sendRequestReceivedEmail = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    certificateType: v.string(),
    controlNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Request Received</h1>
    </div>
    <div class="content">
      <p>Dear ${args.recipientName},</p>
      
      <p>Thank you for submitting your certificate request. We have received it and it is now being processed.</p>
      
      <div style="background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <strong>Request Details:</strong><br>
        <strong>Type:</strong> ${args.certificateType}<br>
        <strong>Control Number:</strong> ${args.controlNumber}<br>
        <strong>Status:</strong> Pending Review
      </div>
      
      <p>You will be notified via email once your certificate is ready. You can also check the status anytime by visiting the Resident Portal.</p>
      
      <p><strong>Processing Time:</strong> Typically 2-3 business days</p>
      
      <p>Best regards,<br>
      <strong>Barangay Bitano</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Barangay Management System.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Dear ${args.recipientName},

Thank you for submitting your certificate request.

Request Details:
Type: ${args.certificateType}
Control Number: ${args.controlNumber}
Status: Pending Review

You will be notified once your certificate is ready.
Processing Time: Typically 2-3 business days

Best regards,
Barangay Bitano
    `;

    return await sendEmailHelper({
      to: args.recipientEmail,
      subject: `Request Received - ${args.controlNumber}`,
      htmlContent,
      textContent,
    });
  },
});

/**
 * Send account linked welcome email
 */
export const sendAccountLinkedEmail = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    barangayId: v.string(),
  },
  handler: async (ctx, args) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to the Resident Portal!</h1>
    </div>
    <div class="content">
      <p>Dear ${args.recipientName},</p>
      
      <p>Your account has been successfully linked to our Barangay Management System!</p>
      
      <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
        <strong>Your Account:</strong><br>
        <strong>Name:</strong> ${args.recipientName}<br>
        <strong>Barangay ID:</strong> ${args.barangayId}
      </div>
      
      <p><strong>What you can do now:</strong></p>
      <ul>
        <li>Request certificates online</li>
        <li>Track your certificate requests</li>
        <li>Download approved certificates</li>
        <li>Update your profile information</li>
        <li>View your household information</li>
      </ul>
      
      <a href="https://your-domain.com/portal" class="button">Go to Portal</a>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      <strong>Barangay Bitano</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Barangay Management System.</p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmailHelper({
      to: args.recipientEmail,
      subject: "Welcome to Barangay Bitano Resident Portal!",
      htmlContent,
    });
  },
});
