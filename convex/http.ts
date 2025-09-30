import { httpRouter } from "convex/server";
import { fulfillClerkWebhook } from "./clerk";

const http = httpRouter();

// Clerk webhook endpoint
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: fulfillClerkWebhook,
});

export default http;
