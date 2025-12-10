# BarangayLink v2

## Start

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A code editor (VS Code recommended)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Your Accounts

You'll need accounts for these services:

| Service | Purpose | Sign Up Link |
|---------|---------|--------------|
| **Convex** | Database & Backend | [convex.dev](https://convex.dev) |
| **Clerk** | User Authentication | [clerk.com](https://clerk.com) |
| **Mapbox** | Maps (Optional) | [mapbox.com](https://mapbox.com) |
| **Resend** | Email Sending (Optional) | [resend.com](https://resend.com) |
| **Liveblocks** | Real-time Features (Optional) | [liveblocks.io](https://liveblocks.io) |

### Step 3: Create Your Environment File

Copy the template and fill in your keys:

```bash
cp .env.template .env.local
```

Open `.env.local` and add your API keys. At minimum, you need:

```env
# Required
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Step 4: Set Up Convex Database

```bash
npx convex login

npx convex dev
```


## Environment Variables Explained

### Required Variables

| Variable | Where to Get It | Description |
|----------|-----------------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex Dashboard → Settings | Your Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | Public key for authentication |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | Secret key (keep private!) |

### Optional Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Enable map features |
| `RESEND_API_KEY` | Send emails (invitations, notifications) |
| `LIVEBLOCKS_SECRET_KEY` | Real-time document collaboration |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Real-time features (client-side) |

---

## Project Structure

```
barangaylink-v2/
├── src/
│   ├── app/                 # Next.js pages and routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── projects/        # Project management
│   │   ├── events/          # Event management
│   │   ├── admin/           # Admin pages
│   │   └── portal/          # Resident portal
│   ├── components/          # Reusable UI components
│   └── lib/                 # Utility functions
├── convex/                  # Backend (database, API)
│   ├── schema.ts           # Database schema
│   ├── users.ts            # User operations
│   ├── projects.ts         # Project operations
│   └── events.ts           # Event operations
├── public/                  # Static files
└── package.json
```


## User Roles

The system has 5 user roles with different permissions:

| Role | Access Level |
|------|--------------|
| **ADMIN** | Full system access, manage all users and settings |
| **CAPTAIN** | Full access except system settings |
| **MANAGER** | Manage projects and events in their department |
| **BUILDER** | Create and edit tasks, assigned projects |
| **WORKER** | View and complete assigned tasks only |

---

## Features Overview

### Dashboard
- Overview of projects, events, and tasks
- Quick stats and recent activity
- Team workload visualization

### Projects
- Create projects with budgets and timelines
- Assign team members
- Track milestones and progress
- Generate reports (PDF/Excel)

### Events
- Community event scheduling
- Task assignment and tracking
- QR code attendance system
- Guest registration

### Admin Panel
- User management and approvals
- Department configuration
- System settings and backups
- Certificate management

### Resident Portal
- Public event viewing
- Certificate requests
- Community announcements

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Convex (serverless database + functions)
- **Auth**: Clerk
- **UI**: Radix UI, Lucide Icons, Framer Motion
- **Maps**: Mapbox GL
- **PDF**: jsPDF, React-PDF
- **Charts**: Recharts

---



