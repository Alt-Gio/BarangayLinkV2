# BarangayLink v2 Database Setup Guide

## 🎯 Overview

This guide will help you set up and manage the complete Convex database for BarangayLink v2. The database is fully managed by Convex with automatic initialization, real-time updates, and comprehensive data management.

## 🚀 Quick Start

### 1. Initialize the Database

```bash
# Option 1: Use the automated script (Recommended)
npm run db:init

# Option 2: Manual initialization
npm run convex:dev  # Start Convex in another terminal
npx convex run databaseManager:initializeDatabase
```

### 2. Check Database Status

```bash
npm run db:status
```

### 3. Start Development

```bash
# Terminal 1: Start Convex
npm run convex:dev

# Terminal 2: Start Next.js
npm run dev
```

## 📊 Database Schema

### Core Tables

1. **userLevels** - User role definitions and permissions
2. **users** - User profiles with gamification data
3. **projects** - Community projects with real-time collaboration
4. **tasks** - Gamified task management system
5. **events** - Community events and calendar
6. **chatRooms** - Real-time communication channels
7. **messages** - Chat message storage
8. **notifications** - System-wide notification system
9. **userSessions** - User session tracking
10. **documents** - File attachment management
11. **financials** - Budget and expense tracking
12. **analytics** - User activity metrics

### User Hierarchy

```
ADMIN (Level 4)    - Full system access
    ↓
MANAGER (Level 3)  - Department oversight
    ↓
BUILDER (Level 2)  - Project management
    ↓
WORKER (Level 1)   - Task execution
```

## 🔧 Database Management

### Available Scripts

```bash
# Database Operations
npm run db:init      # Initialize database with sample data
npm run db:status    # Check database connection and status
npm run db:cleanup   # Clean up old data (sessions, notifications)
npm run db:export    # Export all data (Admin only)

# Convex Operations
npm run convex:dev   # Start Convex development server
npm run convex:deploy # Deploy to production
```

### Manual Database Operations

```bash
# Initialize user levels only
npx convex run seedData:seedUserLevels

# Create sample data
npx convex run seedData:seedSampleData

# Check specific table data
npx convex run databaseManager:getDatabaseStatus

# Sync user from Clerk
npx convex run databaseManager:syncUserFromClerk --clerkId "user_xxx" --email "user@example.com" --name "User Name"
```

## 🏗️ Database Architecture

### Data Flow

```
Clerk Authentication
    ↓
Automatic User Sync
    ↓
Role-Based Permissions
    ↓
Real-Time Data Updates
    ↓
Dashboard Display
```

### Key Features

- **Automatic Initialization**: Database sets up automatically on first run
- **User Sync**: Seamless integration with Clerk authentication
- **Real-Time Updates**: Live data synchronization across all clients
- **Role-Based Access**: Permissions enforced at database level
- **Gamification**: Built-in XP, gold, achievements system
- **Data Validation**: Type-safe operations with Convex schema
- **Error Handling**: Comprehensive error recovery and logging

## 📋 Sample Data

The database initialization creates:

### Sample Users
- **admin@barangaylink.local** (ADMIN) - System Administrator
- **manager@barangaylink.local** (MANAGER) - Department Manager  
- **builder@barangaylink.local** (BUILDER) - Project Coordinator
- **worker@barangaylink.local** (WORKER) - Community Member

### Sample Projects
- Community Garden Expansion
- Youth Sports Program
- Senior Center Renovation

### Sample Events
- Monthly Community Meeting
- Community Clean-up Drive
- Youth Basketball Tournament

### Chat Rooms
- General Discussion
- Project Updates
- Community Events

## 🔒 Security & Permissions

### Permission System

Each user level has specific permissions:

```typescript
WORKER: [
  "users:read", "projects:read", "tasks:read", "tasks:update",
  "events:read", "chat:create", "chat:read", "documents:read"
]

BUILDER: [
  // All WORKER permissions plus:
  "projects:create", "projects:update", "tasks:create", "tasks:delete",
  "events:create", "events:update", "documents:create", "documents:update"
]

MANAGER: [
  // All BUILDER permissions plus:
  "users:update", "users:view", "projects:delete", "events:delete",
  "analytics:read", "financials:approve", "chat:moderate"
]

ADMIN: [
  // All MANAGER permissions plus:
  "system:manage", "users:create", "users:delete", "analytics:manage",
  "financials:delete", "chat:admin", "notifications:system"
]
```

### Data Security

- **Authentication Required**: All operations require valid Clerk session
- **Permission Validation**: Database-level permission checking
- **Data Isolation**: Users only see data they have permission to access
- **Audit Trail**: User sessions and activities are logged
- **Input Validation**: All data validated against Convex schema

## 🛠️ Troubleshooting

### Common Issues

1. **Database Not Initialized**
   ```bash
   npm run db:init
   ```

2. **Convex Connection Failed**
   ```bash
   # Check if Convex is running
   npm run convex:dev
   ```

3. **User Not Found Error**
   ```bash
   # Re-sync user from Clerk
   npx convex run databaseManager:syncUserFromClerk --clerkId "your_clerk_id" --email "your@email.com" --name "Your Name"
   ```

4. **Permission Denied**
   - Check user role and permissions
   - Verify user level assignment
   - Ensure proper authentication

### Debug Commands

```bash
# Check database tables
npm run db:status

# View user levels
npx convex run userLevels:getAll

# Check current user
npx convex run users_fixed:getCurrentUser

# View active sessions
npx convex run userSessions:getActiveSessions
```

## 📈 Performance & Optimization

### Database Optimization

- **Indexed Queries**: All common queries are indexed
- **Conditional Loading**: Data loaded based on user permissions
- **Real-Time Subscriptions**: Efficient WebSocket connections
- **Automatic Cleanup**: Old sessions and notifications cleaned up
- **Caching**: Convex provides automatic query caching

### Monitoring

- **Connection Status**: Real-time connection monitoring
- **Query Performance**: Built-in Convex analytics
- **Error Tracking**: Comprehensive error logging
- **User Activity**: Session and activity tracking

## 🔄 Data Migration

### Backup & Restore

```bash
# Export all data (Admin only)
npm run db:export > backup.json

# Clean up old data
npm run db:cleanup

# Re-initialize if needed
npm run db:init
```

### Production Deployment

```bash
# Deploy to production
npm run convex:deploy

# Verify production database
npx convex run databaseManager:getDatabaseStatus --prod
```

## 🎯 Next Steps

1. **Start Development**: `npm run dev`
2. **Access Dashboard**: Navigate to `/dashboard`
3. **Test User Roles**: Try different permission levels
4. **Create Content**: Add projects, events, and tasks
5. **Monitor Performance**: Use Convex dashboard for analytics

## 📞 Support

- **Convex Documentation**: https://docs.convex.dev
- **Database Schema**: Check `convex/schema.ts`
- **API Reference**: Check `convex/_generated/api.d.ts`
- **Error Logs**: Check browser console and Convex dashboard

---

## ✅ Database Status: FULLY CONFIGURED

Your BarangayLink v2 database is now completely set up with:
- ✅ Automatic initialization
- ✅ Real-time data synchronization  
- ✅ Role-based access control
- ✅ Comprehensive error handling
- ✅ Sample data for testing
- ✅ Production-ready configuration

The database will automatically handle user creation, data validation, and real-time updates across all connected clients!
