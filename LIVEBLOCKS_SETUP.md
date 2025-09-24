# Liveblocks Real-time Collaboration Setup

## 🚀 Features Implemented

I've created a comprehensive real-time collaboration system with the following features:

### ✅ **Online Presence System**
- **Real-time user presence** - See who's online instantly
- **User avatars and roles** - Visual indicators for user hierarchy (ADMIN, MANAGER, BUILDER, WORKER)
- **Activity status** - Live indicators showing user activity
- **Compact presence widget** - For navigation bars and headers

### ✅ **Real-time Chat System**
- **Instant messaging** - Send and receive messages in real-time
- **Typing indicators** - See when others are typing
- **Message timestamps** - Track conversation history
- **System notifications** - User join/leave notifications
- **User avatars in chat** - Visual identification of message senders

### ✅ **Online Users List**
- **Complete user directory** - See all online team members
- **Role-based sorting** - Users sorted by hierarchy (ADMIN → MANAGER → BUILDER → WORKER)
- **Quick actions** - Start chats, video calls (coming soon)
- **User levels and status** - Display user progression and activity

### ✅ **Collaboration Hub**
- **Floating widget** - Non-intrusive interface that doesn't block workflow
- **Tabbed interface** - Switch between Chat and Users views
- **Minimizable/closable** - Full control over visibility
- **Auto-open functionality** - Welcomes users when they join

## 📦 Required Dependencies

Install these packages to use the collaboration features:

```bash
npm install @liveblocks/react @liveblocks/node
npm install @radix-ui/react-avatar @radix-ui/react-tooltip @radix-ui/react-tabs @radix-ui/react-scroll-area @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

## 🔧 Environment Setup

Add these to your `.env.local` file:

```bash
# Liveblocks - REQUIRED for real-time features
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxxxx
LIVEBLOCKS_SECRET_KEY=sk_dev_xxxxx
```

**Get your API keys:**
1. Go to [Liveblocks Dashboard](https://liveblocks.io/dashboard)
2. Create a new project
3. Copy the Public Key and Secret Key

## 🎯 How to Use

### 1. **Basic Integration**
Add the collaboration hub to any page:

```tsx
import { LiveblocksClientProvider } from '@/components/liveblocks/LiveblocksClientProvider';
import { CollaborationHub } from '@/components/liveblocks/CollaborationHub';

export default function MyPage() {
  return (
    <LiveblocksClientProvider>
      <div>
        {/* Your page content */}
        <CollaborationHub roomId="my-room" defaultOpen={false} />
      </div>
    </LiveblocksClientProvider>
  );
}
```

### 2. **Add Presence to Navigation**
Show online users in your header:

```tsx
import { OnlinePresence } from '@/components/liveblocks/OnlinePresence';

function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <OnlinePresence maxVisible={5} showSelf={true} />
      </nav>
    </header>
  );
}
```

### 3. **Standalone Chat Component**
Use just the chat feature:

```tsx
import { RoomProvider } from '@liveblocks/react/suspense';
import { RealtimeChat } from '@/components/liveblocks/RealtimeChat';

function ChatPage() {
  return (
    <RoomProvider id="chat-room">
      <RealtimeChat roomId="chat-room" className="w-full h-96" />
    </RoomProvider>
  );
}
```

### 4. **Users List Only**
Display online users without chat:

```tsx
import { OnlineUsersList } from '@/components/liveblocks/OnlineUsersList';

function UsersPage() {
  return (
    <OnlineUsersList 
      className="w-80 h-96"
      onStartChat={(userId, userName) => {
        console.log('Start chat with:', userName);
      }}
    />
  );
}
```

## 🏗️ Components Created

### Core Components
- **`OnlinePresence.tsx`** - Shows online users with avatars
- **`RealtimeChat.tsx`** - Full-featured chat component
- **`OnlineUsersList.tsx`** - List of online users with actions
- **`CollaborationHub.tsx`** - Complete collaboration widget

### UI Components
- **`Avatar`** - User profile pictures
- **`Badge`** - Status and role indicators
- **`Button`** - Interactive elements
- **`Input`** - Message input field
- **`Tooltip`** - Hover information
- **`Tabs`** - Tabbed interface
- **`ScrollArea`** - Scrollable content
- **`Card`** - Content containers

### Pages
- **`/collaboration`** - Demo page showcasing all features
- **`/test-liveblocks`** - Testing and debugging page

## 🎨 Customization

### Room Configuration
```tsx
<CollaborationHub 
  roomId="project-123"           // Unique room identifier
  defaultOpen={true}             // Auto-open on load
  className="custom-styles"      // Custom CSS classes
/>
```

### Presence Configuration
```tsx
<OnlinePresence 
  maxVisible={3}                 // Max avatars to show
  showSelf={false}              // Include current user
/>
```

### Chat Configuration
```tsx
<RealtimeChat 
  roomId="team-chat"
  isMinimized={false}
  onToggleMinimize={() => {}}
/>
```

## 🔐 Security & Permissions

The system integrates with your existing Clerk authentication:
- **User identification** - Uses Clerk user data
- **Role-based display** - Shows user roles and levels
- **Secure rooms** - Each room requires authentication
- **Permission checking** - Validates user access

## 🚀 Integration with Dashboard

Add to your dashboard layout:

```tsx
// In your layout or dashboard component
import { CollaborationHub } from '@/components/liveblocks/CollaborationHub';

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
      <CollaborationHub roomId="dashboard-chat" />
    </div>
  );
}
```

## 📱 Responsive Design

All components are fully responsive:
- **Mobile-friendly** - Touch-optimized interactions
- **Adaptive layouts** - Adjusts to screen size
- **Accessible** - Keyboard navigation support

## 🎯 Next Steps

1. **Install dependencies** (see above)
2. **Set up environment variables**
3. **Test with `/collaboration` page**
4. **Integrate into your dashboard**
5. **Customize styling to match your brand**

## 🔧 Troubleshooting

If you encounter issues:
1. Check environment variables are set
2. Ensure Liveblocks account is configured
3. Visit `/test-liveblocks` for debugging
4. Check browser console for errors
5. Verify Clerk authentication is working

## 🌟 Future Enhancements

Coming soon:
- **Video calling** - One-click video meetings
- **Screen sharing** - Share your screen with team
- **File sharing** - Drag and drop file uploads
- **Document collaboration** - Real-time document editing
- **Voice messages** - Quick voice notes
- **Private messaging** - Direct messages between users

The collaboration system is now ready to use! 🎉
