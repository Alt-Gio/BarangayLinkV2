import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * OTP VERIFICATION SYSTEM WITH RESEND
 * Used for email verification before feedback submission and event RSVP
 */

// Generate and send OTP via email
export const sendOTP = action({
  args: {
    email: v.string(),
    purpose: v.union(v.literal("feedback"), v.literal("event_rsvp")),
    metadata: v.optional(v.object({
      projectId: v.optional(v.string()),
      eventId: v.optional(v.string()),
      projectTitle: v.optional(v.string()),
      eventTitle: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { email, purpose, metadata }) => {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with expiry (10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await ctx.runMutation(api.otp.storeOTP, {
      email,
      otp,
      purpose,
      expiresAt,
    });

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const purposeText = purpose === "feedback" ? "submit your feedback" : "join the event";
    const projectOrEvent = metadata?.projectTitle || metadata?.eventTitle || "BarangayLink";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "BarangayLink <noreply@barangaylink.com>",
          to: [email],
          subject: `Your verification code for ${projectOrEvent}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BarangayLink</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
                  </div>
                  
                  <!-- Body -->
                  <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                      Hello! You requested to ${purposeText} for:
                    </p>
                    
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="color: #10b981; font-weight: 600; margin: 0; font-size: 16px;">
                        ${projectOrEvent}
                      </p>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      Your verification code is:
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="text-align: center; margin: 30px 0;">
                      <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </span>
                      </div>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 25px 0;">
                      <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                        ⏰ <strong>This code expires in 10 minutes.</strong> If you didn't request this code, please ignore this email.
                      </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                      For security reasons, never share this code with anyone. Our team will never ask for your verification code.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 5px 0;">
                      © 2025 BarangayLink. All rights reserved.
                    </p>
                    <p style="margin: 5px 0;">
                      Empowering communities through technology.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend API error:", error);
        throw new Error("Failed to send OTP email");
      }

      return { success: true, message: "OTP sent to your email" };
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw new Error("Failed to send OTP. Please try again.");
    }
  },
});

// Store OTP in database (internal mutation)
export const storeOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
    purpose: v.union(v.literal("feedback"), v.literal("event_rsvp")),
    expiresAt: v.number(),
  },
  handler: async (ctx, { email, otp, purpose, expiresAt }) => {
    // Delete any existing OTPs for this email and purpose
    const existing = await ctx.db
      .query("otpVerifications")
      .filter((q) => q.and(
        q.eq(q.field("email"), email),
        q.eq(q.field("purpose"), purpose)
      ))
      .collect();

    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // Insert new OTP
    await ctx.db.insert("otpVerifications", {
      email: email.toLowerCase(),
      otp,
      purpose,
      expiresAt,
      verified: false,
      attempts: 0,
    });
  },
});

// Verify OTP
export const verifyOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
    purpose: v.union(v.literal("feedback"), v.literal("event_rsvp")),
  },
  handler: async (ctx, { email, otp, purpose }) => {
    const record = await ctx.db
      .query("otpVerifications")
      .filter((q) => q.and(
        q.eq(q.field("email"), email.toLowerCase()),
        q.eq(q.field("purpose"), purpose),
        q.eq(q.field("verified"), false)
      ))
      .first();

    if (!record) {
      return { 
        success: false, 
        error: "No OTP found. Please request a new code." 
      };
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      await ctx.db.delete(record._id);
      return { 
        success: false, 
        error: "OTP expired. Please request a new code." 
      };
    }

    // Check attempts (max 3)
    if (record.attempts >= 3) {
      await ctx.db.delete(record._id);
      return { 
        success: false, 
        error: "Too many failed attempts. Please request a new code." 
      };
    }

    // Verify OTP
    if (record.otp === otp) {
      // Mark as verified
      await ctx.db.patch(record._id, { verified: true });
      
      // Note: Verified OTPs are cleaned up by the periodic cleanupExpiredOTPs function
      // or can be deleted immediately since they're no longer needed
      await ctx.db.delete(record._id);

      return { 
        success: true, 
        message: "Email verified successfully!" 
      };
    } else {
      // Increment attempts
      await ctx.db.patch(record._id, { 
        attempts: record.attempts + 1 
      });

      return { 
        success: false, 
        error: `Invalid code. ${3 - record.attempts - 1} attempts remaining.` 
      };
    }
  },
});

// Check if email is verified for a specific purpose
export const isEmailVerified = query({
  args: {
    email: v.string(),
    purpose: v.union(v.literal("feedback"), v.literal("event_rsvp")),
  },
  handler: async (ctx, { email, purpose }) => {
    const record = await ctx.db
      .query("otpVerifications")
      .filter((q) => q.and(
        q.eq(q.field("email"), email.toLowerCase()),
        q.eq(q.field("purpose"), purpose),
        q.eq(q.field("verified"), true)
      ))
      .first();

    return !!record;
  },
});

// Clean up expired OTPs (run periodically)
export const cleanupExpiredOTPs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("otpVerifications")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const record of expired) {
      await ctx.db.delete(record._id);
    }

    return { deleted: expired.length };
  },
});
