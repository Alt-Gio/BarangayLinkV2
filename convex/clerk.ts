import { httpAction, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { WebhookEvent } from "@clerk/clerk-sdk-node";
import { Webhook } from "svix";

export const fulfillClerkWebhook = httpAction(async (ctx, request) => {
  const payloadString = await request.text();
  const headerPayload = request.headers;

  try {
    // Verify webhook directly
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET environment variable is not set");
    }
    const wh = new Webhook(webhookSecret);
    const result = wh.verify(payloadString, {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    }) as WebhookEvent;
    
    switch (result.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.createOrUpdateFromClerk, {
          data: result.data,
        });
        break;
      case "user.deleted":
        if (result.data?.id) {
          await ctx.runMutation(internal.users.deleteUser, {
            clerkUserId: result.data.id,
          });
        }
        break;
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
});

export const fulfill = internalAction({
  args: {
    payload: v.string(),
    headers: v.object({
      svix_id: v.string(),
      svix_timestamp: v.string(), 
      svix_signature: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET environment variable is not set");
    }
    const wh = new Webhook(webhookSecret);
    const payload = wh.verify(args.payload, {
      "svix-id": args.headers.svix_id,
      "svix-timestamp": args.headers.svix_timestamp,
      "svix-signature": args.headers.svix_signature,
    }) as WebhookEvent;
    return payload;
  },
});
