# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Clerk Authentication
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Convex Database
```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment
```

### Liveblocks (Real-time Collaboration)
```env
LIVEBLOCKS_SECRET_KEY=sk_prod_your_key_here
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_prod_your_key_here
```

### Email (Resend)
```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

### Optional Variables
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Setup Instructions

1. Copy this template to `.env.local`
2. Fill in your actual API keys
3. Never commit `.env.local` to version control
4. For production deployment, set these in your hosting platform's environment variables

## Getting API Keys

### Clerk
1. Sign up at https://clerk.com
2. Create a new application
3. Get your publishable and secret keys from the dashboard
4. Set up webhooks for user management

### Convex
1. Sign up at https://convex.dev
2. Create a new project
3. Run `npx convex dev` to get your development URL
4. For production, run `npx convex deploy`

### Liveblocks
1. Sign up at https://liveblocks.io
2. Create a new project
3. Get your API keys from the dashboard

### Resend
1. Sign up at https://resend.com
2. Verify your domain
3. Get your API key from the dashboard
