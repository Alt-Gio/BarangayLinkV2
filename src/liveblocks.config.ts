import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 100,
});

// Define Liveblocks types for your application
type Presence = {
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

type Storage = {
  // Add storage types as needed
};

type UserMeta = {
  id: string;
  info: {
    name?: string;
    avatar?: string;
    role?: string;
    level?: number;
  };
};

type RoomEvent =
  | { type: "USER_JOINED"; user: { name: string; id: string } }
  | { type: "USER_LEFT"; user: { name: string; id: string } }
  | { type: "NOTIFICATION"; message: string }
  | { type: "CHAT_MESSAGE"; message: string; user: { name: string; id: string; avatar?: string } }
  | { type: "USER_TYPING"; isTyping: boolean; user: { name: string; id: string } }
  | { type: "CHAT_REQUEST"; fromUser: { name: string; id: string }; toUser: { name: string; id: string } };

type ThreadMetadata = {
  resolved?: boolean;
  projectId?: string;
  taskId?: string;
  resourceType?: 'project' | 'task' | 'event' | 'sprint' | 'document';
  resourceId?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: 'question' | 'feedback' | 'bug' | 'feature' | 'general';
  assignedTo?: string[];
  tags?: string[];
  createdAt?: number;
};

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useHistory,
    useUndo,
    useRedo,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStatus,
    useLostConnectionListener,
    useThreads,
    useUser,
    useCreateThread,
    useEditThreadMetadata,
    useCreateComment,
    useEditComment,
    useDeleteComment,
    useAddReaction,
    useRemoveReaction,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export { client };
