import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Facebook Messenger Webhook Handler
 * Receives messages from Messenger and stores them in the database
 */
export const handleMessengerWebhook = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  
  // Webhook verification (GET request from Facebook)
  if (request.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    
    const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || "your_verify_token_here";
    
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully!");
      return new Response(challenge, { status: 200 });
    } else {
      console.error("Webhook verification failed");
      return new Response("Forbidden", { status: 403 });
    }
  }
  
  // Handle incoming messages (POST request)
  if (request.method === "POST") {
    try {
      const body = await request.json();
      
      console.log("Received webhook:", JSON.stringify(body, null, 2));
      
      if (body.object === "page") {
        // Process each messaging event
        for (const entry of body.entry) {
          for (const event of entry.messaging) {
            const senderId = event.sender.id;
            const recipientId = event.recipient.id;
            
            // Handle incoming message
            if (event.message && event.message.text) {
              const messageText = event.message.text;
              const messageId = event.message.mid;
              const timestamp = event.timestamp;
              
              console.log(`Message from ${senderId}: ${messageText}`);
              
              // Store the message in Convex
              await ctx.runMutation(api.facebook.storeIncomingMessengerMessage, {
                messengerMessageId: messageId,
                facebookUserId: senderId,
                content: messageText,
                timestamp: timestamp,
              });
              
              // Optionally send automatic reply via Messenger API
              // await sendMessengerMessage(senderId, "Message received!");
            }
            
            // Handle message delivery confirmation
            if (event.delivery) {
              console.log("Message delivery confirmed:", event.delivery);
            }
            
            // Handle message read confirmation
            if (event.read) {
              console.log("Message read confirmed:", event.read);
            }
          }
        }
        
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
      
      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  
  return new Response("Method Not Allowed", { status: 405 });
});

/**
 * Send message via Messenger API
 * This is an action that can be called from mutations to send messages
 */
export const sendMessengerMessage = httpAction(async (ctx, request) => {
  try {
    const { recipientId, message, userId } = await request.json();
    
    // Get user's access token
    const tokenData = await ctx.runQuery(api.facebook.getAccessToken, {
      userId: userId,
    });
    
    if (!tokenData || !tokenData.pageAccessToken) {
      return new Response(
        JSON.stringify({ error: "No valid access token found" }),
        { status: 400 }
      );
    }
    
    const accessToken = tokenData.pageAccessToken;
    
    // Send message via Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Error sending message:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: data }),
        { status: response.status }
      );
    }
    
    console.log("Message sent successfully:", data);
    
    return new Response(
      JSON.stringify({ success: true, messageId: data.message_id }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in sendMessengerMessage:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
