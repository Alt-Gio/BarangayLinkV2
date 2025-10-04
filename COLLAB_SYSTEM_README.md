# BarangayLink Collaboration System

## Overview
A complete real-time collaboration system with modern UI, private/group messaging, notifications, and online presence tracking - fully integrated with Convex backend.

## ✨ Features Implemented

### 1. **Real-time Messaging**
- **Private Chat**: Direct 1-on-1 messaging between users
- **Group Chat**: Create group conversations with multiple members
- **Message History**: Persistent message storage in Convex
- **Read Receipts**: Track who has read messages
- **Real-time Updates**: Instant message delivery using Convex subscriptions

### 2. **Online Presence Tracking**
- **Live Status**: See who's online, away, or offline in real-time
- **Auto-detection**: Automatic presence updates via heartbeat system
- **Status Indicators**: Color-coded badges (green=online, yellow=away, gray=offline)
- **Last Seen**: Track when users were last active
- **Smart Sorting**: Online users automatically appear at the top of lists

### 3. **Notification System**
- **Real-time Alerts**: Instant notifications for new messages, mentions, and system events
- **Database Persistence**: All notifications stored in Convex for history
- **Category Badges**: Visual categorization (chat, alerts, announcements, system)
- **Unread Count**: Track unread notifications with badge indicators
- **Mark as Read**: Individual or bulk mark as read functionality
- **Delete**: Remove individual notifications

### 4. **Member Management**
- **Smart Member List**: Sortable list with online status priority
- **Search Functionality**: Filter members by name, department, or position
- **Role Indicators**: Visual badges for ADMIN, MANAGER, BUILDER, WORKER
- **Multi-select**: Select multiple users for group chat creation
- **Quick Actions**: One-click private messaging from member cards

### 5. **Modern UI Design**
- **Dark Theme**: Professional dark mode with gradient accents
- **Responsive Layout**: Three-column layout optimized for desktop
- **Full-screen Usage**: Maximizes screen space efficiently
- **Smooth Animations**: Polished transitions and hover effects
- **Clean Typography**: Easy-to-read fonts and proper spacing
- **Status Colors**: Intuitive color coding throughout

## 📁 File Structure

### Convex Backend
```
convex/
├── schema.ts                   # Updated with onlinePresence table
├── chat.ts                     # Chat room and message management
├── presence.ts                 # Online presence tracking
├── notifications.ts            # Enhanced notification system
├── users.ts                    # User management (existing)
└── liveblocks.ts              # Liveblocks integration (existing)
```

### Frontend Components
```
src/components/collab/
├── MembersList.tsx            # Member list with online status & search
├── ChatInterface.tsx          # Main chat UI with messages
├── ChatRoomsList.tsx          # List of user's chat rooms
└── NotificationsPanel.tsx     # Real-time notifications panel

src/app/collab/
└── page.tsx                   # Main collaboration page (redesigned)
```

## 🔧 Convex Functions

### Chat Functions (`convex/chat.ts`)
- `getOrCreateDirectChat` - Create or retrieve 1-on-1 chat
- `createGroupChat` - Create group conversation
- `getUserChatRooms` - Get all user's chat rooms
- `sendMessage` - Send message to room
- `getRoomMessages` - Retrieve room messages
- `markMessagesAsRead` - Mark messages as read

### Presence Functions (`convex/presence.ts`)
- `updatePresence` - Update user's online status
- `getOnlineUsers` - Get list of online users
- `getAllUsersWithStatus` - Get all users with status
- `heartbeat` - Keep user presence alive
- `getUserPresence` - Get specific user's status

### Notification Functions (`convex/notifications.ts`)
- `getAllUserNotifications` - Get user's notifications
- `markNotificationRead` - Mark single notification as read
- `markAllNotificationsRead` - Mark all as read
- `createNotification` - Create new notification
- `deleteNotification` - Delete notification
- `getUnreadNotificationsCount` - Get unread count

## 🚀 How It Works

### Online Presence System
1. When user enters `/collab` page, presence is set to "online"
2. Heartbeat runs every 60 seconds to keep status active
3. If no heartbeat for 5 minutes, status changes to "offline"
4. All presence changes are reflected in real-time across all clients

### Chat Flow
1. **Starting a Chat**:
   - Click member card → Opens/creates direct chat
   - Select multiple members → Create group chat
   
2. **Sending Messages**:
   - Type in textarea, press Enter or click Send
   - Message saved to Convex `messages` table
   - Real-time delivery to all participants
   - Notifications sent to offline participants

3. **Reading Messages**:
   - Opening a chat marks messages as read
   - Unread count updated in real-time
   - Read receipts tracked per user

### Notification Flow
1. **Trigger Events**:
   - New message received
   - User mentioned
   - System alerts
   - Project updates

2. **Display**:
   - Badge on bell icon shows unread count
   - Notifications panel shows full list
   - Color-coded by type and category

3. **Actions**:
   - Click to mark as read
   - Delete to remove
   - "Mark all read" button for bulk action

## 🎨 UI/UX Features

### Layout
- **Left Panel (25%)**: Live notifications and alerts
- **Center Panel (50%)**: Chat interface / room list
- **Right Panel (25%)**: Team members with online status

### Design Elements
- Gradient backgrounds for visual appeal
- Glassmorphism effects with backdrop blur
- Smooth transitions on hover and interactions
- Consistent spacing and padding
- Professional dark theme with accent colors

### User Experience
- Online users always appear first
- Unread badges prominently displayed
- Clear visual hierarchy
- Intuitive navigation
- Responsive feedback on actions

## 🔐 Security & Permissions

### Authentication
- All queries/mutations check `ctx.auth.getUserIdentity()`
- Users can only access their own chats and notifications
- Presence updates require authentication

### Data Access
- Users only see their own chat rooms
- Participants verified before message access
- Notifications filtered by userId

## 📊 Database Schema

### onlinePresence
```typescript
{
  userId: Id<"users">,
  clerkId: string,
  lastSeen: number,
  status: "online" | "away" | "offline",
  currentPage: string (optional),
  isActive: boolean
}
```

### chatRooms
```typescript
{
  name: string,
  type: "general" | "project" | "department" | "direct",
  participants: Id<"users">[],
  createdBy: Id<"users">,
  isActive: boolean,
  lastMessage: string (optional),
  lastMessageAt: number (optional)
}
```

### messages
```typescript
{
  roomId: Id<"chatRooms">,
  content: string,
  messageType: "text" | "file" | "system",
  sender: Id<"users">,
  attachments: Id<"documents">[],
  replyTo: Id<"messages"> (optional),
  isEdited: boolean,
  readBy: { userId, readAt }[]
}
```

### notifications (enhanced)
```typescript
{
  userId: Id<"users">,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" | "welcome",
  category: string,
  isRead: boolean,
  actionUrl: string (optional),
  metadata: any (optional),
  createdAt: number
}
```

## 🎯 Key Improvements

### From Previous Design
1. ✅ **Removed white box** in lower right - replaced with proper sidebar
2. ✅ **Member list with sorting** - online users at top
3. ✅ **Private & group chat** - full messaging functionality
4. ✅ **Convex integration** - all data persisted and synced
5. ✅ **Real-time notifications** - database + live updates
6. ✅ **Clean design** - modern, professional UI
7. ✅ **Full space usage** - efficient three-column layout
8. ✅ **Better communication** - organized chat system

## 🚦 Usage

### Starting a Private Chat
1. Go to `/collab`
2. Find member in right sidebar
3. Click chat icon or member card
4. Start messaging!

### Creating a Group Chat
1. Select multiple members (click to select)
2. Click "Start Group Chat" button
3. Name will be auto-generated
4. Start messaging with the group!

### Managing Notifications
1. View count badge on bell icon
2. Click notification to mark as read
3. Delete individual notifications
4. Use "Mark all read" for bulk action

## 🔄 Real-time Updates

All features use Convex's real-time subscriptions:
- New messages appear instantly
- Online status updates immediately
- Notifications delivered in real-time
- Unread counts update automatically
- Member list refreshes on status change

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Success**: Emerald (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Background**: Gray-900 to Gray-800 gradient

### Status Colors
- **Online**: Emerald-500 (green)
- **Away**: Yellow-500 (yellow)
- **Offline**: Gray-500 (gray)

### Role Colors
- **ADMIN**: Red-400
- **MANAGER**: Blue-400
- **BUILDER**: Emerald-400
- **WORKER**: Gray-400

## 📱 Responsive Design
The layout is optimized for desktop (1024px+) with:
- Three-column layout on large screens
- Stacked layout on mobile
- Touch-friendly interactions
- Optimized spacing for all devices

## 🔧 Future Enhancements (Optional)
- [ ] File attachments in messages
- [ ] Emoji picker integration
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Voice/video calls
- [ ] Message search
- [ ] Chat archives
- [ ] Custom notification sounds
- [ ] Desktop notifications API
- [ ] Message formatting (bold, italic, etc.)

## 🐛 Troubleshooting

### Messages not appearing
- Check Convex dashboard for errors
- Verify user is authenticated
- Check network tab for failed requests

### Presence not updating
- Ensure heartbeat is running (check console)
- Verify onlinePresence table exists in Convex
- Check if 5-minute timeout has occurred

### Notifications not showing
- Verify notifications table has data
- Check if user has permission to view
- Ensure real-time subscription is active

---

**Built with**: Next.js 14, Convex, Clerk, Tailwind CSS, Radix UI, Lucide Icons
**Date**: 2025-09-30
**Version**: 2.0.0
