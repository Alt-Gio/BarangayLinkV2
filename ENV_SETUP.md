# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOY_KEY=your_convex_deploy_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk Webhook (for automatic user sync)
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Liveblocks (for real-time collaboration) - REQUIRED
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=your_liveblocks_public_key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

## Setup Instructions

### 1. Convex Setup
1. Run `npx convex dev` to create a new Convex project
2. Copy the deployment URL to `NEXT_PUBLIC_CONVEX_URL`
3. Get the deploy key from Convex dashboard for `CONVEX_DEPLOY_KEY`

### 2. Clerk Setup
1. Create a new Clerk application at https://clerk.com
2. Copy the publishable key to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy the secret key to `CLERK_SECRET_KEY`

### 3. Clerk Webhook Setup (for automatic user sync)
1. In Clerk Dashboard, go to Webhooks
2. Create a new webhook endpoint: `https://your-domain.com/api/clerk-webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret to `CLERK_WEBHOOK_SECRET`

### 4. Liveblocks Setup (optional - for real-time collaboration)
1. Create account at https://liveblocks.io
2. Create a new project
3. Copy the public key to `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
4. Copy the secret key to `LIVEBLOCKS_SECRET_KEY`

## User Synchronization

### Automatic Sync (Recommended)
- Set up the Clerk webhook as described above
- Users will be automatically created in Convex when they sign up in Clerk

### Manual Sync
- Visit `/admin/sync` page after signing in
- Click "Sync Current User to Convex" to manually sync your account
- Each user can sync themselves individually

## Troubleshooting

### Schema Validation Errors
If you see errors like "Object contains extra field that is not in the validator", it means the data being inserted doesn't match the Convex schema. Check:
1. Schema definitions in `convex/schema.ts`
2. Data being inserted in mutation functions
3. Ensure all required fields are present and optional fields are properly typed

### User Not Found Errors
If users exist in Clerk but not in Convex:
1. Check if webhook is properly configured
2. Use manual sync from `/admin/sync` page
3. Ensure user levels are initialized (`npm run db:init`)

### Database Initialization
Run these commands in order:
```bash
npx convex dev          # Start Convex development server
npm run db:init         # Initialize database with user levels and sample data
```
