# 🚀 Quick Deployment Commands

## 🎯 Deploy to Vercel (Recommended)

### One-Line Deploy
```bash
npx vercel --prod
```

### Step-by-Step
```bash
# 1. Install Vercel CLI (one time)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy to production
vercel --prod
```

### Via GitHub (Automatic)
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Import project on vercel.com
# 3. Auto-deploy on every push ✅
```

---

## 🔧 Pre-Deployment Setup

### 1. Deploy Convex Backend
```bash
# Deploy Convex database & functions
npx convex deploy

# Copy the deployment URL to .env.local
# NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
```

### 2. Configure Environment Variables
```bash
# Create .env.local if not exists
# Add all required variables (see ENVIRONMENT_VARIABLES.md)
```

### 3. Test Build Locally
```bash
# Build for production
npm run build

# Test production build
npm start

# Visit http://localhost:3000
```

---

## 📦 Build Commands

```bash
# Development
npm run dev                # Start dev server with Turbopack

# Production Build
npm run build             # Build for production
npm start                 # Start production server

# Database
npm run db:init          # Initialize database
npm run db:status        # Check database status
npm run db:cleanup       # Cleanup old data
npm run db:export        # Export all data

# Convex
npm run convex:dev       # Start Convex development
npm run convex:deploy    # Deploy Convex to production

# Verification
npx tsc --noEmit         # Check TypeScript errors
npm run lint             # Run ESLint
```

---

## 🌐 Deployment Platforms

### Vercel
```bash
vercel --prod
```
**Environment Variables Location:**  
Project Settings → Environment Variables

### Netlify
```bash
netlify deploy --prod
```
**Environment Variables Location:**  
Site Settings → Environment Variables

### Railway
```bash
railway up
```
**Environment Variables Location:**  
Project → Variables

---

## 🔑 Required Environment Variables

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
CONVEX_DEPLOYMENT=prod:...

# Optional
RESEND_API_KEY=re_...
LIVEBLOCKS_SECRET_KEY=sk_...
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## ✅ Post-Deployment Checklist

```bash
# 1. Verify deployment
curl https://yourdomain.com

# 2. Check health
curl https://yourdomain.com/api/health

# 3. Test authentication
# Visit /sign-in

# 4. Check database connection
# Visit /dashboard (requires login)

# 5. Test features
# - Create project
# - Assign task
# - Send message
# - Upload document
```

---

## 🔄 Update Deployment

```bash
# Make changes
git add .
git commit -m "Update feature X"
git push origin main

# Vercel auto-deploys ✅
# Or manually:
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working
```bash
# Verify in deployment platform
# Restart deployment after adding vars
vercel --prod --force
```

### Database Connection Failed
```bash
# Verify Convex is deployed
npx convex deploy

# Check NEXT_PUBLIC_CONVEX_URL is correct
```

---

## 📊 Monitor Deployment

### Vercel
```bash
# View logs
vercel logs

# View deployment info
vercel inspect
```

### Check Performance
```bash
# Run Lighthouse
npx lighthouse https://yourdomain.com

# Check bundle size
npm run build -- --analyze
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Deploy** | `vercel --prod` |
| **Build** | `npm run build` |
| **Dev Server** | `npm run dev` |
| **Deploy Convex** | `npx convex deploy` |
| **View Logs** | `vercel logs` |
| **Rollback** | `vercel rollback` |

---

**Ready to deploy? Run:** `vercel --prod` 🚀
