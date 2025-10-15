# Facebook Messenger Integration Setup Guide

This guide will help you integrate Meta's Messenger API with your BarangayLink messaging system, allowing users to sync messages between your internal chat and Facebook Messenger.

## Overview

The integration allows:
- **Two-way message sync** between your internal chat and Facebook Messenger
- **Facebook OAuth** connection for users to link their accounts
- **Real-time notifications** for incoming Messenger messages
- **Message history sync** between platforms
- **Unified interface** to manage both internal and Messenger conversations

## Prerequisites

1. **Facebook Developer Account**: Create one at https://developers.facebook.com
2. **Facebook App**: You'll need to create a Facebook App
3. **SSL Certificate**: Your app must be served over HTTPS (required by Facebook)

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in your app details:
   - **App Name**: "BarangayLink Messenger"
   - **App Contact Email**: Your email
   - **Business Account**: (Optional)

5. Once created, go to **App Dashboard**

## Step 2: Configure Messenger Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Messenger"** and click **"Set Up"**
3. In the Messenger Settings:
   - Scroll to **"Access Tokens"**
   - Click **"Add or Remove Pages"**
   - Connect your Facebook Page (you need a Facebook Page for messaging)
   - Generate a **Page Access Token** (save this securely)

## Step 3: Configure Webhooks

### 3.1 Get Your Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/convex/messenger-webhook
```

Or if using Convex deployment:
```
https://[your-convex-site].convex.site/messenger-webhook
```

### 3.2 Set Up Webhook in Facebook

1. In Messenger Settings, scroll to **"Webhooks"**
2. Click **"Add Callback URL"**
3. Enter:
   - **Callback URL**: Your webhook URL (see above)
   - **Verify Token**: Create a random string (e.g., `my_verify_token_12345`)
     - Save this token, you'll need it in environment variables
4. Click **"Verify and Save"**

5. Subscribe to webhook fields:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `messaging_optins`
   - ✅ `message_deliveries`
   - ✅ `message_reads`

## Step 4: Configure App Permissions

1. Go to **"App Review" > "Permissions and Features"**
2. Request these permissions:
   - `pages_messaging` - Required for sending/receiving messages
   - `pages_manage_metadata` - Required for page management
   - `pages_read_engagement` - Required to read messages

3. Submit for review if your app is in Development mode

## Step 5: Environment Variables

Add these to your `.env.local` file:

```env
# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Messenger Webhook
MESSENGER_VERIFY_TOKEN=my_verify_token_12345

# Your Convex deployment
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### How to Get These Values:

- **FACEBOOK_APP_ID**: App Dashboard > Settings > Basic > App ID
- **FACEBOOK_APP_SECRET**: App Dashboard > Settings > Basic > App Secret (click "Show")
- **MESSENGER_VERIFY_TOKEN**: The random string you created in Step 3.2

## Step 6: Database Setup

The database schema has already been extended with:

### Tables Added:
1. **facebookConnections** - Stores user Facebook account connections
2. **messageSyncLog** - Tracks message sync between platforms

Run Convex deployment to apply schema changes:
```bash
npm run convex:deploy
```

## Step 7: Test the Integration

### 7.1 Test Webhook Verification

Test that your webhook is accessible:
```bash
curl "https://your-webhook-url?hub.mode=subscribe&hub.verify_token=my_verify_token_12345&hub.challenge=test_challenge"
```

Should return: `test_challenge`

### 7.2 Connect Facebook Account

1. Navigate to your Messages page
2. Look for the **"Facebook Messenger"** integration card
3. Click **"Connect Facebook"**
4. Log in with Facebook and grant permissions
5. Select your Facebook Page

### 7.3 Send Test Message

1. Send a message from Messenger to your connected Facebook Page
2. Check your internal chat - the message should appear
3. Reply from your internal chat
4. Check Messenger - your reply should appear

## Step 8: Message Flow

### Inbound Messages (Messenger → Internal Chat)

1. User sends message via Facebook Messenger
2. Facebook sends webhook event to `/messenger-webhook`
3. Webhook handler processes the message
4. Message is stored in `messages` table
5. Sync log entry created in `messageSyncLog`
6. User sees message in internal chat

### Outbound Messages (Internal Chat → Messenger)

1. User sends message in internal chat
2. Message stored in database
3. If Messenger sync is enabled, message sent to Facebook Graph API
4. Facebook delivers message via Messenger
5. Sync log entry created

## Step 9: Using the MessengerIntegration Component

Add the Messenger integration panel to your messages page:

```tsx
import { MessengerIntegration } from "@/components/chat/MessengerIntegration";

// In your component:
<MessengerIntegration className="mb-6" />
```

Features:
- ✅ Connect/disconnect Facebook account
- ✅ Toggle Messenger sync on/off
- ✅ Toggle notifications
- ✅ View sync status and last sync time
- ✅ See connected Facebook profile

## API Reference

### Convex Functions

#### `api.facebook.connectFacebookAccount`
Connect user's Facebook account
```typescript
await connectFacebookAccount({
  facebookUserId: string,
  facebookName: string,
  facebookProfilePic?: string,
  accessToken: string,
  pageAccessToken?: string,
  tokenExpiresAt?: number,
  pageId?: string,
});
```

#### `api.facebook.getFacebookConnection`
Get current user's Facebook connection status
```typescript
const connection = useQuery(api.facebook.getFacebookConnection);
```

#### `api.facebook.disconnectFacebook`
Disconnect Facebook account
```typescript
await disconnectFacebook();
```

#### `api.facebook.updateMessengerSettings`
Update Messenger sync settings
```typescript
await updateMessengerSettings({
  messengerEnabled: boolean,
  notificationsEnabled: boolean,
});
```

### HTTP Endpoints

#### `POST /messenger-webhook`
Receives incoming messages from Facebook
- Validates webhook signature
- Processes message events
- Stores messages in database

#### `GET /messenger-webhook`
Webhook verification endpoint
- Used by Facebook to verify your webhook
- Returns challenge token

#### `POST /send-messenger-message`
Send message via Messenger API
```json
{
  "recipientId": "facebook_user_id",
  "message": "Hello from BarangayLink!",
  "userId": "convex_user_id"
}
```

## Security Considerations

### 1. Token Storage
- Access tokens are stored encrypted in the database
- Never expose tokens in client-side code
- Tokens should be refreshed before expiry

### 2. Webhook Verification
- Always verify webhook signatures from Facebook
- Use the verify token to prevent unauthorized access
- Validate payload structure

### 3. Rate Limiting
- Facebook has rate limits on API calls
- Implement retry logic for failed requests
- Monitor API usage in Facebook Developer Dashboard

### 4. Data Privacy
- Users must consent to data sync
- Comply with GDPR and local data protection laws
- Provide clear privacy policy
- Allow users to disconnect at any time

## Troubleshooting

### Webhook Not Receiving Messages

1. **Check webhook URL is accessible**
   ```bash
   curl https://your-webhook-url
   ```

2. **Verify webhook subscription**
   - Go to Messenger Settings > Webhooks
   - Check subscribed fields include `messages`

3. **Check webhook logs**
   - View Convex logs for webhook events
   - Check for error messages

### Messages Not Syncing

1. **Verify Facebook connection is active**
   ```typescript
   const connection = useQuery(api.facebook.getFacebookConnection);
   console.log(connection?.syncStatus); // Should be "active"
   ```

2. **Check access token validity**
   - Tokens expire, may need refresh
   - Test with Facebook Graph API Explorer

3. **Review sync logs**
   ```typescript
   const syncLogs = useQuery(api.facebook.getRoomSyncStatus, { roomId });
   // Check for failed syncs
   ```

### OAuth Popup Blocked

- Instruct users to allow popups for your domain
- Provide alternative: redirect-based OAuth flow

## Production Checklist

- [ ] App reviewed and approved by Facebook
- [ ] All required permissions granted
- [ ] Webhook URL uses HTTPS
- [ ] Environment variables configured
- [ ] Error logging implemented
- [ ] Rate limiting configured
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] User consent flow implemented
- [ ] Data retention policy defined
- [ ] Backup strategy in place

## Additional Resources

- [Facebook Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform)
- [Facebook Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Webhooks Reference](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review)

## Support

For issues or questions:
1. Check Facebook Developer Community
2. Review Convex documentation
3. Consult your development team

---

**Note**: This integration requires active maintenance as Facebook APIs evolve. Regularly check for API version updates and deprecation notices.
