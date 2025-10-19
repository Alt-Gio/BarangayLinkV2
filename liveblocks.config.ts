// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      user?: {
        id: string;
        name: string;
        avatar: string;
        role: string;
        level: number;
      };
      cursor?: { x: number; y: number } | null;
      selection?: any;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Add storage types as needed
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name?: string;
        avatar?: string;
        role?: string;
        level?: number;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: 
      | { type: "USER_JOINED"; user: { name: string; id: string } }
      | { type: "USER_LEFT"; user: { name: string; id: string } }
      | { type: "NOTIFICATION"; message: string }
      | { type: "CHAT_MESSAGE"; message: string; user: { name: string; id: string; avatar?: string } }
      | { type: "USER_TYPING"; isTyping: boolean; user: { name: string; id: string } }
      | { type: "CHAT_REQUEST"; fromUser: { name: string; id: string }; toUser: { name: string; id: string } };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      resolved?: boolean;
      projectId?: string;
      taskId?: string;
      resourceType?: 'project' | 'task' | 'event' | 'sprint' | 'document';
      resourceId?: string;
      priority?: 'low' | 'medium' | 'high';
      category?: 'question' | 'feedback' | 'bug' | 'feature' | 'general';
      assignedTo?: string; // Comma-separated user IDs
      tags?: string; // Comma-separated tags
      createdAt?: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      title?: string;
      type?: string;
    };
  }
}

export {};
