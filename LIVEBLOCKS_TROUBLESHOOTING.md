# Liveblocks Troubleshooting Guide

## Common Error: "Unauthorized: Not authorized (401 returned by POST /api/liveblocks-auth)"

This error occurs when the Liveblocks authentication endpoint returns a 401 status. Here's how to fix it:

### 1. Check Environment Variables

**Required Environment Variables:**
```bash
# In your .env.local file
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxxxx  # From Liveblocks dashboard
LIVEBLOCKS_SECRET_KEY=sk_dev_xxxxx              # From Liveblocks dashboard
```

**How to get these keys:**
1. Go to [Liveblocks Dashboard](https://liveblocks.io/dashboard)
2. Create a new project or select existing one
3. Go to "API Keys" section
4. Copy the Public Key to `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
5. Copy the Secret Key to `LIVEBLOCKS_SECRET_KEY`

### 2. Verify Clerk Authentication

The Liveblocks auth endpoint requires a valid Clerk session:

```typescript
// Check if user is signed in
const { user } = useUser();
if (!user) {
  // User must be signed in to use Liveblocks
}
```

### 3. Test the Setup

Visit `/test-liveblocks` page to test your Liveblocks configuration:
- Check if environment variables are set
- Verify Clerk authentication
- Test Liveblocks connection

### 4. Debug Steps

1. **Check Server Logs:**
   ```bash
   npm run dev
   # Look for Liveblocks auth logs in the console
   ```

2. **Check Browser Console:**
   - Open Developer Tools → Console
   - Look for Liveblocks connection errors
   - Check Network tab for failed requests to `/api/liveblocks-auth`

3. **Verify Environment Variables:**
   ```bash
   # In your terminal
   echo $NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
   echo $LIVEBLOCKS_SECRET_KEY
   ```

### 5. Common Issues and Solutions

#### Issue: "LIVEBLOCKS_SECRET_KEY environment variable is not set"
**Solution:** Add the secret key to your `.env.local` file and restart the dev server.

#### Issue: "No userId from Clerk auth"
**Solution:** 
- Ensure user is signed in through Clerk
- Check Clerk configuration in your app
- Verify Clerk middleware is properly set up

#### Issue: "Room ID required"
**Solution:** Ensure your Liveblocks components are wrapped in a `RoomProvider` with a valid room ID.

#### Issue: "Invalid request body"
**Solution:** The Liveblocks client is not sending the room ID correctly. Check your RoomProvider setup.

### 6. Correct Implementation

**App Layout with Liveblocks:**
```tsx
import { LiveblocksClientProvider } from '@/components/liveblocks/LiveblocksClientProvider';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <LiveblocksClientProvider>
          {children}
        </LiveblocksClientProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
```

**Using Liveblocks in a Component:**
```tsx
import { RoomProvider } from '@liveblocks/react/suspense';

function MyCollaborativeComponent() {
  return (
    <RoomProvider id="my-room-id">
      {/* Your collaborative content here */}
    </RoomProvider>
  );
}
```

### 7. Environment File Example

Create `.env.local` in your project root:
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your_deploy_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Liveblocks - REQUIRED for real-time collaboration
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxxxx
LIVEBLOCKS_SECRET_KEY=sk_dev_xxxxx
```

### 8. Restart Required

After adding environment variables, restart your development server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 9. Production Deployment

For production, ensure environment variables are set in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Other platforms: Check their documentation

### 10. Getting Help

If you're still having issues:
1. Check the [Liveblocks Documentation](https://liveblocks.io/docs)
2. Visit the test page: `/test-liveblocks`
3. Check server logs for detailed error messages
4. Ensure all dependencies are installed: `npm install @liveblocks/react @liveblocks/node`
