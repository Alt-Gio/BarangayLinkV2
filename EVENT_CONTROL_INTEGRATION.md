# 🔗 Event Control - Integration Guide

## Quick Access to Event Control

To access Event Control for any event, add a button to your events page:

### **Option 1: Add to Event Card**

In your event card component (wherever you display events), add:

```tsx
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

// Inside your EventCard component:
const router = useRouter();

<Button
  onClick={() => router.push(`/events/${event._id}/control`)}
  className="bg-emerald-600 hover:bg-emerald-700"
>
  <Target className="w-4 h-4 mr-2" />
  Event Control
</Button>
```

### **Option 2: Add to Event Details Page**

In `/events/[eventId]/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, ListTodo } from "lucide-react";

// In your event details page:
<div className="flex gap-3">
  <Link href={`/events/${eventId}/control`}>
    <Button className="bg-emerald-600 hover:bg-emerald-700">
      <Target className="w-4 h-4 mr-2" />
      Open Event Control
    </Button>
  </Link>
  
  <Link href={`/events/${eventId}`}>
    <Button variant="outline">
      <ListTodo className="w-4 h-4 mr-2" />
      Event Details
    </Button>
  </Link>
</div>
```

---

## URL Structure

```
/events                          → All events (calendar view)
/events/[eventId]                → Event details
/events/[eventId]/control        → Event Control Board ⭐ NEW!
```

---

## Access Permissions

**Who can access Event Control?**
- ✅ **Event Organizer** (creator)
- ✅ **Event Attendees**
- ✅ **MANAGER, CAPTAIN, ADMIN** roles

**Who can assign tasks?**
- ✅ **MANAGER, CAPTAIN, ADMIN** only
- ❌ WORKER, BUILDER (can create/update own tasks only)

---

## Example: Full Event Card with Control Button

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Target } from "lucide-react";

export function EventCard({ event }: { event: any }) {
  const router = useRouter();

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              {event.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {event.description}
            </p>
          </div>
          <Badge variant="secondary">{event.type}</Badge>
        </div>

        <div className="space-y-2 mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(event.startDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {event.location}
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {event.attendees.length} attendees
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/events/${event._id}`)}
            variant="outline"
            className="flex-1 border-gray-600 hover:bg-gray-700"
          >
            View Details
          </Button>
          <Button
            onClick={() => router.push(`/events/${event._id}/control`)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Target className="w-4 h-4 mr-2" />
            Event Control
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Testing the Integration

1. **Go to** `/events` (Event Calendar)
2. **Click** any event card
3. **Click** "Event Control" button
4. **You should see** the Kanban board at `/events/[eventId]/control`

---

## Troubleshooting

### "Event Control not showing"
- ✅ Check that `convex/eventControl.ts` exists
- ✅ Verify `convex/schema.ts` has `eventTasks` table
- ✅ Run `npx convex dev` to deploy schema

### "Cannot create tasks"
- ✅ Verify user is authenticated
- ✅ Check user has active status (not pending)
- ✅ Verify event exists in database

### "Permission denied on assign"
- ✅ Only MANAGER/CAPTAIN/ADMIN can assign tasks
- ✅ Check user's userLevel in database
- ✅ Cannot assign to higher-level users

---

## What's Next?

After integration, you can:

1. **Create tasks** for your events
2. **Assign team members** based on hierarchy
3. **Track progress** with Kanban board
4. **Monitor deadlines** and overdue tasks
5. **Log time** on tasks
6. **Add comments** and collaborate

**Ready to organize your events like Jira/Monday.com!** 🚀
