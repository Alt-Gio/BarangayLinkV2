import { action } from "./_generated/server";
import { v } from "convex/values";

// Email sending action using Resend
export const sendInvitationEmail = action({
  args: {
    to: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    invitationToken: v.string(),
    invitedByName: v.string(),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BarangayLink <notifications@barangaylink.com>";
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured. Please add RESEND_API_KEY to your .env.local");
    }

    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation/${args.invitationToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to BarangayLink</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.2); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                    🎉 You're Invited!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                    Join BarangayLink V2
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; color: white;">
                  <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6;">
                    Hi <strong>${args.firstName} ${args.lastName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">
                    <strong>${args.invitedByName}</strong> has invited you to join <strong>BarangayLink V2</strong> - a powerful project management and collaboration platform.
                  </p>

                  ${args.customMessage ? `
                    <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 8px;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-style: italic;">
                        "${args.customMessage}"
                      </p>
                    </div>
                  ` : ''}

                  <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #10b981; font-size: 18px;">
                      🚀 Get Started
                    </h3>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.8);">
                      Click the button below to accept your invitation and create your account. This link will expire in 7 days.
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-top: 10px;">
                          <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <h4 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 16px;">
                      ✨ What You'll Get
                    </h4>
                    <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.8;">
                      <li>Collaborative project management tools</li>
                      <li>Real-time task tracking and updates</li>
                      <li>Team communication features</li>
                      <li>Progress analytics and reporting</li>
                      <li>Gamified productivity system</li>
                    </ul>
                  </div>

                  <p style="margin: 24px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.6);">
                    <strong>Note:</strong> If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; word-break: break-all;">
                    <a href="${invitationLink}" style="color: #10b981;">
                      ${invitationLink}
                    </a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(30, 41, 59, 0.5); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">
                    <strong>BarangayLink V2</strong>
                  </p>
                  <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                    Empowering communities through collaboration
                  </p>
                  <p style="margin: 16px 0 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                    This invitation was sent by ${args.invitedByName}. If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [args.to],
          subject: `🎉 You're invited to join BarangayLink V2`,
          html: htmlContent,
          reply_to: FROM_EMAIL,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend API error:", error);
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Email sent successfully:", data);
      return { success: true, emailId: data.id };
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },
});

// Resend invitation email
export const resendInvitationEmail = action({
  args: {
    to: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    invitationToken: v.string(),
    invitedByName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction("emails:sendInvitationEmail" as any, {
      to: args.to,
      firstName: args.firstName,
      lastName: args.lastName,
      invitationToken: args.invitationToken,
      invitedByName: args.invitedByName,
    });
  },
});
