import { httpRouter } from "convex/server";
import { fulfillClerkWebhook } from "./clerk";
import { handleMessengerWebhook, sendMessengerMessage } from "./messengerWebhook";

const http = httpRouter();

// Clerk webhook endpoint
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: fulfillClerkWebhook,
});

// Facebook Messenger webhook endpoint
http.route({
  path: "/messenger-webhook",
  method: "GET",
  handler: handleMessengerWebhook,
});

http.route({
  path: "/messenger-webhook",
  method: "POST",
  handler: handleMessengerWebhook,
});

// Messenger send message endpoint
http.route({
  path: "/send-messenger-message",
  method: "POST",
  handler: sendMessengerMessage,
});

export default http;
