import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper function to convert base64 to ArrayBuffer (Buffer is not available in Convex runtime)
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// System prompt for the AI assistant - focused on work, simple for general questions
const SYSTEM_PROMPT = `You are "Aling" (short for Barangay Link Assistant), a helpful voice assistant for barangay workers.

PERSONALITY:
- Friendly, respectful, and efficient
- Speak in the same language the user uses (Tagalog, English, or mixed)
- Keep responses SHORT and CLEAR (1-3 sentences max)
- Be patient and helpful, especially for elderly users

YOUR CAPABILITIES (Work-Related - FULL ASSISTANCE):
1. ATTENDANCE: Clock in, clock out, check schedule, check attendance history
2. TASKS: Create tasks, list tasks, mark complete, assign tasks, check due dates
3. PROJECTS: Query project status, list projects, project details
4. EVENTS: Check events, RSVP, event details
5. NOTIFICATIONS: Read notifications, mark as read
6. USER INFO: Check user profile, check stats, XP, level

RESPONSE FORMAT FOR WORK COMMANDS:
When user wants to perform an action, respond with JSON:
{
  "action": "action_name",
  "params": { ... },
  "response": "What to say to user"
}

AVAILABLE ACTIONS:
- stop_task_timer: STOP the running task timer (trigger words: "stop timer", "stop working", "itigil", "stop task", "clock out from task", "end task")
- check_current_task: Check what task user is working on (trigger words: "what am I working on", "anong task ko", "current task")
- clock_in: Clock user in for GENERAL work attendance (trigger words: "clock in", "time in", "pasok")
- clock_out: Clock user out from GENERAL work (trigger words: "clock out", "time out", "uwi na")
- check_work_status: Check overall work status
- create_task: Create a new task (params: title, description?, priority?, dueDate?)
- list_tasks: List user's tasks (params: filter?: "today"|"overdue"|"all")
- complete_task: Mark task as done (params: taskTitle or taskId)
- list_projects: Show user's projects
- check_schedule: Show today's schedule
- check_notifications: Read unread notifications
- check_due_today: What's due today
- general_query: For database queries

TASK TIMER vs GENERAL CLOCK:
- "stop timer", "stop working on task", "itigil timer" → stop_task_timer (stops the TASK timer)
- "clock out" → clock_out (general attendance only)
- If user mentions a specific task or event, use stop_task_timer
- If user is asking about current task/timer, use check_current_task

TASK TIMER EXAMPLES:
- "Stop my timer" → {"action": "stop_task_timer", "params": {}, "response": "Stopping your task timer!"}
- "I want to stop working on this task" → {"action": "stop_task_timer", "params": {}, "response": "Stopping your current task timer!"}
- "Itigil mo na timer ko" → {"action": "stop_task_timer", "params": {}, "response": "Okay, ititigil ko na ang timer mo!"}
- "What task am I working on?" → {"action": "check_current_task", "params": {}, "response": "Let me check your current task..."}

FOR GENERAL QUESTIONS (Non-work):
- Give SIMPLE, dictionary-style answers (1-2 sentences)
- Examples:
  - "What is a dolphin?" → "A dolphin is an intelligent marine mammal that lives in oceans and rivers."
  - "Ilan ang days bago pasko?" → "May X araw pa bago ang Pasko."
  - "What's the capital of Japan?" → "Tokyo is the capital of Japan."

IMPORTANT RULES:
1. If it's work-related → Parse into action JSON
2. If it's general knowledge → Give simple answer, no JSON
3. Never give long explanations unless specifically asked
4. Always be respectful (use "po" in Tagalog responses)
5. If unsure about intent, ask for clarification briefly

CONTEXT ABOUT USER (will be provided):
- User's name, department, role
- Current tasks and their status
- Today's schedule
- Recent activity`;

// Transcribe audio using Whisper
export const transcribeAudio = action({
  args: {
    audioBase64: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }

    // Convert base64 to blob
    const audioBuffer = base64ToArrayBuffer(args.audioBase64);
    const blob = new Blob([audioBuffer], { type: args.mimeType || "audio/webm" });

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "auto"); // Auto-detect language
    formData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Whisper API error:", error);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      text: result.text,
      language: result.language || "unknown",
    };
  },
});

// Get user context for the AI
export const getUserContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .take(20);

    const todaysTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate >= today.getTime() && t.dueDate < tomorrow.getTime();
    });

    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate < today.getTime();
    });

    // Get unread notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .take(5);

    // Get today's events
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), today.getTime()),
          q.lt(q.field("startDate"), tomorrow.getTime())
        )
      )
      .take(5);

    // Get user's projects
    const projectMembers = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(10);

    const userProjects = projectMembers.filter(
      (p) => p.assignedTo?.includes(args.userId) || p.createdBy === args.userId
    );

    return {
      user: {
        name: user.name,
        department: user.department,
        role: user.role,
        position: user.position,
        level: user.level,
        xp: user.xp,
      },
      tasks: {
        total: tasks.length,
        today: todaysTasks.map((t) => ({ id: t._id, title: t.title, priority: t.priority })),
        overdue: overdueTasks.map((t) => ({ id: t._id, title: t.title, dueDate: t.dueDate })),
      },
      notifications: notifications.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
      })),
      events: events.map((e) => ({
        id: e._id,
        title: e.title,
        startDate: e.startDate,
        location: e.location,
      })),
      projects: userProjects.map((p) => ({
        id: p._id,
        title: p.title,
        status: p.status,
      })),
      currentTime: Date.now(),
      todayDate: today.toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  },
});

// Type definitions
interface VoiceCommandResult {
  response: string;
  action: string | null;
  params?: Record<string, unknown>;
  isWorkRelated?: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  priority?: string;
  dueDate?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
}

interface EventItem {
  id: string;
  title: string;
  startDate: number;
}

interface ProjectItem {
  id: string;
  title: string;
}

// Process voice command with Llama
export const processCommand = action({
  args: {
    userId: v.id("users"),
    transcribedText: v.string(),
    conversationHistory: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
    }))),
  },
  handler: async (ctx, args): Promise<VoiceCommandResult> => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }

    // Get user context
    const userContext = await ctx.runQuery(internal.voiceAssistant.getUserContext, {
      userId: args.userId,
    });

    if (!userContext) {
      return {
        response: "Sorry, I couldn't find your user profile. Please try again.",
        action: null,
      };
    }

    // Build context message - cast through unknown to avoid type mismatch
    const uc = userContext as unknown as {
      user: { name: string; department?: string; role?: string; position?: string; level?: number; xp?: number };
      tasks: { today: TaskItem[]; overdue: TaskItem[] };
      notifications: NotificationItem[];
      events: EventItem[];
      projects: ProjectItem[];
      currentTime: number;
      todayDate: string;
    };

    const contextMessage: string = `
CURRENT USER CONTEXT:
- Name: ${uc.user.name}
- Department: ${uc.user.department || "Not set"}
- Role: ${uc.user.role || "Worker"}
- Position: ${uc.user.position || "Staff"}
- Level: ${uc.user.level || 1}, XP: ${uc.user.xp || 0}

TODAY'S DATE: ${uc.todayDate}
CURRENT TIME: ${new Date(uc.currentTime).toLocaleTimeString("en-PH")}

TASKS DUE TODAY (${uc.tasks.today.length}):
${uc.tasks.today.map((t: TaskItem) => `- ${t.title} (${t.priority})`).join("\n") || "No tasks due today"}

OVERDUE TASKS (${uc.tasks.overdue.length}):
${uc.tasks.overdue.map((t: TaskItem) => `- ${t.title}`).join("\n") || "No overdue tasks"}

UNREAD NOTIFICATIONS (${uc.notifications.length}):
${uc.notifications.map((n: NotificationItem) => `- ${n.title}: ${n.message}`).join("\n") || "No new notifications"}

TODAY'S EVENTS:
${uc.events.map((e: EventItem) => `- ${e.title} at ${new Date(e.startDate).toLocaleTimeString("en-PH")}`).join("\n") || "No events today"}

ACTIVE PROJECTS:
${uc.projects.map((p: ProjectItem) => `- ${p.title}`).join("\n") || "No active projects"}
`;

    // Prepare messages for Llama
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextMessage },
      ...(args.conversationHistory || []),
      { role: "user", content: args.transcribedText },
    ];

    const response: Response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Llama API error:", error);
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const result = await response.json() as { choices: Array<{ message?: { content?: string } }> };
    const aiResponse: string = result.choices[0]?.message?.content || "";

    // Try to parse as JSON action
    try {
      // Check if response contains JSON action
      const jsonMatch = aiResponse.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (jsonMatch) {
        const actionData = JSON.parse(jsonMatch[0]);
        return {
          response: actionData.response,
          action: actionData.action,
          params: actionData.params || {},
          isWorkRelated: true,
        };
      }
    } catch {
      // Not a JSON response, treat as general answer
    }

    // Return as general response
    return {
      response: aiResponse,
      action: null,
      params: {},
      isWorkRelated: false,
    };
  },
});

// Action result type
interface ActionResult {
  success: boolean;
  message?: string;
  taskId?: unknown;
  tasks?: unknown;
  notifications?: unknown;
  schedule?: unknown;
  projects?: unknown;
  route?: string; // For navigation actions
  duration?: number; // For timer actions
  taskTitle?: string; // For task timer actions
  hasActiveTask?: boolean;
  taskName?: string;
  taskMinutes?: number;
  eventName?: string;
  isClockedIn?: boolean;
  clockInTime?: number;
  currentSessionMinutes?: number;
  todayWorkMinutes?: number;
}

// Execute work actions
export const executeAction = action({
  args: {
    userId: v.id("users"),
    action: v.string(),
    params: v.any(),
  },
  handler: async (ctx, args): Promise<ActionResult> => {
    const { userId, action, params } = args;

    switch (action) {
      case "clock_in": {
        const result = await ctx.runMutation(internal.voiceAssistant.recordAttendance, {
          userId,
          type: "clock_in",
        }) as { success: boolean; message: string };
        return result;
      }

      case "clock_out": {
        const result = await ctx.runMutation(internal.voiceAssistant.recordAttendance, {
          userId,
          type: "clock_out",
        }) as { success: boolean; message: string; duration?: number };
        return result;
      }

      case "check_work_status": {
        const status = await ctx.runQuery(internal.voiceAssistant.getWorkStatus, { userId });
        return { success: true, ...status };
      }

      case "stop_task_timer": {
        const result = await ctx.runMutation(internal.voiceAssistant.stopCurrentTaskTimer, {
          userId,
        }) as { success: boolean; message: string; taskTitle?: string; duration?: number };
        return result;
      }

      case "check_current_task": {
        const result = await ctx.runQuery(internal.voiceAssistant.getCurrentTask, { userId });
        return { 
          success: true, 
          hasActiveTask: result.hasActiveTask,
          taskName: result.taskName as string | undefined,
          taskMinutes: result.taskMinutes,
          eventName: result.eventName as string | undefined,
          message: result.message,
        };
      }

      case "navigate": {
        // Navigation is handled client-side, just return the route
        return { 
          success: true, 
          message: `Navigating to ${params.route}`,
          route: params.route,
        };
      }

      case "create_task": {
        // Convert date string to timestamp if provided
        let dueDateTimestamp: number | undefined;
        if (params.dueDate) {
          const parsed = Date.parse(params.dueDate);
          dueDateTimestamp = isNaN(parsed) ? undefined : parsed;
        }
        const taskId: unknown = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
          userId,
          title: params.title || "Untitled Task",
          description: params.description || "",
          priority: params.priority || "medium",
          dueDate: dueDateTimestamp,
        });
        return { success: true, message: "Task created!", taskId };
      }

      case "complete_task": {
        const result = await ctx.runMutation(internal.voiceAssistant.completeTaskByTitle, {
          userId,
          titleSearch: params.taskTitle || params.title,
        }) as ActionResult;
        return result;
      }

      case "list_tasks": {
        const tasks: unknown = await ctx.runQuery(internal.voiceAssistant.getTasksList, {
          userId,
          filter: params.filter || "all",
        });
        return { success: true, tasks };
      }

      case "check_due_today": {
        const tasks: unknown = await ctx.runQuery(internal.voiceAssistant.getTasksList, {
          userId,
          filter: "today",
        });
        return { success: true, tasks };
      }

      case "check_notifications": {
        const notifications: unknown = await ctx.runQuery(internal.voiceAssistant.getUnreadNotifications, {
          userId,
        });
        return { success: true, notifications };
      }

      case "check_schedule": {
        const schedule: unknown = await ctx.runQuery(internal.voiceAssistant.getTodaySchedule, {
          userId,
        });
        return { success: true, schedule };
      }

      case "list_projects": {
        const projects: unknown = await ctx.runQuery(internal.voiceAssistant.getUserProjects, {
          userId,
        });
        return { success: true, projects };
      }

      default:
        return { success: false, message: "Action not recognized" };
    }
  },
});

// Internal mutations for voice actions
export const recordAttendance = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("clock_in"), v.literal("clock_out")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user and their current status
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const metadata = (user.metadata as Record<string, unknown>) || {};
    const workStatus = metadata.workStatus as Record<string, unknown> || {};
    const isClockedIn = workStatus.isClockedIn === true;

    // Prevent double clock in/out
    if (args.type === "clock_in" && isClockedIn) {
      return { success: false, message: "Already clocked in" };
    }
    if (args.type === "clock_out" && !isClockedIn) {
      return { success: false, message: "Not clocked in yet" };
    }

    // Calculate duration if clocking out
    let duration: number | undefined;
    if (args.type === "clock_out" && workStatus.clockInTime) {
      duration = Math.floor((now - (workStatus.clockInTime as number)) / 1000 / 60); // minutes
    }

    // Update user's work status in metadata
    await ctx.db.patch(args.userId, {
      metadata: {
        ...metadata,
        workStatus: {
          isClockedIn: args.type === "clock_in",
          clockInTime: args.type === "clock_in" ? now : undefined,
          clockOutTime: args.type === "clock_out" ? now : workStatus.clockOutTime,
          lastAction: args.type,
          lastActionTime: now,
          todayWorkMinutes: ((workStatus.todayWorkMinutes as number) || 0) + (duration || 0),
        },
        currentActivity: args.type === "clock_in" 
          ? { type: "task", startedAt: now }
          : { type: "none" },
      } as Record<string, unknown>,
    });

    // Log the activity
    await ctx.db.insert("userActivityLogs", {
      userId: args.userId,
      activityType: "action",
      action: args.type,
      timestamp: now,
      duration,
      metadata: {
        workDuration: duration,
        clockedInAt: args.type === "clock_out" ? workStatus.clockInTime : now,
      },
    });

    // Create a notification for the user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "info",
      title: args.type === "clock_in" ? "Clocked In ⏰" : "Clocked Out 👋",
      message: args.type === "clock_in" 
        ? `You clocked in at ${new Date(now).toLocaleTimeString()}`
        : `You clocked out. Worked ${duration || 0} minutes today.`,
      isRead: false,
      createdAt: now,
      priority: "low",
    });

    return { 
      success: true, 
      message: args.type === "clock_in" 
        ? "Successfully clocked in!" 
        : `Successfully clocked out! You worked ${duration || 0} minutes.`,
      duration,
    };
  },
});

// Get user's current work status
export const getWorkStatus = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { isClockedIn: false, message: "User not found" };
    }

    const metadata = (user.metadata as Record<string, unknown>) || {};
    const workStatus = metadata.workStatus as Record<string, unknown> || {};
    const currentActivity = metadata.currentActivity as Record<string, unknown> || {};
    
    const isClockedIn = workStatus.isClockedIn === true;
    const clockInTime = workStatus.clockInTime as number | undefined;
    const todayWorkMinutes = (workStatus.todayWorkMinutes as number) || 0;
    
    // Check for active task timer
    const hasActiveTask = currentActivity.type === 'task';
    const taskName = currentActivity.name as string | undefined;
    const taskStartedAt = currentActivity.startedAt as number | undefined;
    
    // Calculate current session duration if clocked in
    let currentSessionMinutes = 0;
    if (isClockedIn && clockInTime) {
      currentSessionMinutes = Math.floor((Date.now() - clockInTime) / 1000 / 60);
    }
    
    // Calculate task timer duration
    let taskMinutes = 0;
    if (hasActiveTask && taskStartedAt) {
      taskMinutes = Math.floor((Date.now() - taskStartedAt) / 1000 / 60);
    }

    return {
      isClockedIn,
      clockInTime,
      currentSessionMinutes,
      todayWorkMinutes: todayWorkMinutes + currentSessionMinutes,
      hasActiveTask,
      taskName,
      taskMinutes,
      message: hasActiveTask 
        ? `You are working on "${taskName}" for ${taskMinutes} minutes.`
        : isClockedIn 
          ? `You are clocked in. Working for ${currentSessionMinutes} minutes.`
          : `You are not clocked in. Today's work: ${todayWorkMinutes} minutes.`,
    };
  },
});

// Stop current running task timer
export const stopCurrentTaskTimer = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Find running task timer for this user
    const runningSession = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRunning"), true))
      .first();

    if (!runningSession) {
      return { success: false, message: "No active task timer found. You're not working on any task." };
    }

    const now = Date.now();
    const duration = Math.round((now - runningSession.startTime) / 60000); // minutes

    // Stop the timer
    await ctx.db.patch(runningSession._id, {
      endTime: now,
      duration,
      isRunning: false,
    });

    // Get task info for response
    const task = await ctx.db.get(runningSession.taskId);
    const taskTitle = task?.title || "your task";

    // Clear current activity from user metadata
    const metadata = (user.metadata as Record<string, unknown>) || {};
    await ctx.db.patch(args.userId, {
      metadata: {
        ...metadata,
        currentActivity: { type: "none" },
      } as Record<string, unknown>,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "info",
      title: "Task Timer Stopped ⏹️",
      message: `Stopped working on "${taskTitle}". Duration: ${duration} minutes.`,
      isRead: false,
      createdAt: now,
      priority: "low",
    });

    return { 
      success: true, 
      message: `Stopped timer for "${taskTitle}". You worked ${duration} minutes.`,
      taskTitle,
      duration,
    };
  },
});

// Get current running task
export const getCurrentTask = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { hasActiveTask: false, message: "User not found" };
    }

    const metadata = (user.metadata as Record<string, unknown>) || {};
    const currentActivity = metadata.currentActivity as Record<string, unknown> || {};
    
    if (currentActivity.type !== 'task') {
      return { hasActiveTask: false, message: "You're not working on any task right now." };
    }

    const taskStartedAt = currentActivity.startedAt as number;
    const taskMinutes = Math.floor((Date.now() - taskStartedAt) / 1000 / 60);
    const eventInfo = currentActivity.eventInfo as Record<string, unknown> | undefined;

    return {
      hasActiveTask: true,
      taskId: currentActivity.id,
      taskName: currentActivity.name,
      taskMinutes,
      eventName: eventInfo?.title,
      message: `You're working on "${currentActivity.name}"${eventInfo?.title ? ` for event "${eventInfo.title}"` : ''}. Timer: ${taskMinutes} minutes.`,
    };
  },
});

export const createTaskFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    dueDate: v.optional(v.number()),
    // Context for linking task to event/milestone/project
    eventId: v.optional(v.id("events")),
    milestoneId: v.optional(v.id("milestones")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // If eventId provided, get the event to find its project
    let projectId = args.projectId;
    if (args.eventId && !projectId) {
      const event = await ctx.db.get(args.eventId);
      if (event?.projectId) {
        projectId = event.projectId;
      }
    }
    
    // If milestoneId provided, get the milestone to find its project
    let defaultStatus = "todo";
    if (args.milestoneId) {
      const milestone = await ctx.db.get(args.milestoneId);
      if (milestone?.projectId && !projectId) {
        projectId = milestone.projectId;
      }
      
      // Get first column for default status
      const columns = await ctx.db
        .query("kanbanColumns")
        .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId!))
        .collect();
      
      if (columns.length > 0) {
        const sortedColumns = columns.sort((a, b) => (a.order || 0) - (b.order || 0));
        defaultStatus = sortedColumns[0]?.statusKey || "todo";
      }
    }
    
    const taskId = await ctx.db.insert("tasks", {
      userId: args.userId,
      title: args.title,
      description: args.description || "",
      type: "todo",
      difficulty: "medium",
      status: defaultStatus,  // Use dynamic column status
      priority: args.priority as "low" | "medium" | "high" | "urgent",
      completed: false,
      dueDate: args.dueDate,
      createdAt: Date.now(),
      createdBy: args.userId,
      assignedTo: [args.userId],
      storyPoints: 3,  // DEFAULT STORY POINTS for progress tracking!
      experienceReward: 10,
      goldReward: 5,
      completionCount: 0,
      tags: [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      loggedHours: [],
      isBlocking: false,
      // Link to event/milestone/project
      eventId: args.eventId,
      milestoneId: args.milestoneId,
      projectId: projectId,
    });

    return taskId;
  },
});

// Create EVENT TASK from voice command (stored in eventTasks table)
export const createEventTaskFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get event details for response
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Get the highest order index for new tasks
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event_status", (q) => 
        q.eq("eventId", args.eventId).eq("status", "todo")
      )
      .collect();
    const maxOrder = tasks.reduce((max, task) => Math.max(max, task.orderIndex), -1);
    
    const taskId = await ctx.db.insert("eventTasks", {
      eventId: args.eventId,
      title: args.title,
      description: args.description || "",
      status: "todo",
      priority: (args.priority as "low" | "medium" | "high" | "critical") || "medium",
      assignedTo: [args.userId],
      createdBy: args.userId,
      orderIndex: maxOrder + 1,
      blockedBy: [],
      blocking: [],
      hasSubtasks: false,
      progress: 0,
      tags: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    });

    return { taskId, eventName: event.title };
  },
});

// ========== EVENT TASK VOICE COMMANDS ==========

// Clock in to event task via voice
export const clockInEventTaskFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    taskTitle: v.optional(v.string()), // If provided, find task by name
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Get all tasks for this event
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    if (tasks.length === 0) {
      throw new Error("No tasks found in this event");
    }

    // Find task - by title match or user's assigned task
    let task;
    if (args.taskTitle) {
      task = tasks.find(t => 
        t.title.toLowerCase().includes(args.taskTitle!.toLowerCase())
      );
      if (!task) {
        throw new Error(`Task "${args.taskTitle}" not found`);
      }
    } else {
      // Find user's first assigned task that's not done
      const assignments = await ctx.db
        .query("eventTaskAssignments")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      const assignedTaskIds = assignments.map(a => a.taskId);
      task = tasks.find(t => 
        assignedTaskIds.includes(t._id) && 
        t.status !== "done" && 
        t.status !== "in_review"
      );
      
      if (!task) {
        throw new Error("No assigned tasks found. Say 'assign me to [task name]' first.");
      }
    }

    // Check if user is assigned
    const assignment = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task_user", (q) => 
        q.eq("taskId", task._id).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!assignment) {
      throw new Error(`You're not assigned to "${task.title}". Say 'assign me to ${task.title}' first.`);
    }

    // Check if already clocked in
    const existingSession = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("isRunning"), true)
        )
      )
      .first();

    if (existingSession) {
      throw new Error(`You're already clocked in to "${task.title}"`);
    }

    // Check if user has other running timers
    const otherSession = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRunning"), true))
      .first();

    if (otherSession) {
      const otherTask = await ctx.db.get(otherSession.taskId);
      throw new Error(`Please clock out from "${otherTask?.title || 'your current task'}" first`);
    }

    // Create time entry
    await ctx.db.insert("eventTaskTimeEntries", {
      taskId: task._id,
      userId: args.userId,
      startTime: now,
      endTime: undefined,
      duration: undefined,
      description: undefined,
      isRunning: true,
      createdAt: now,
    });

    // Update task status to in_progress if needed
    if (task.status !== "in_progress" && task.status !== "done" && task.status !== "in_review") {
      await ctx.db.patch(task._id, {
        status: "in_progress",
        startDate: task.startDate || now,
        updatedAt: now,
      });
    }

    // Update user's current activity
    const event = await ctx.db.get(args.eventId);
    const metadata = (user.metadata as any) || {};
    await ctx.db.patch(args.userId, {
      metadata: {
        ...metadata,
        currentActivity: {
          type: 'task',
          id: task._id,
          name: task.title,
          eventInfo: event ? { id: event._id, title: event.title, type: event.type || 'community' } : null,
          startedAt: now,
        },
      } as any,
    });

    return { 
      success: true, 
      taskTitle: task.title, 
      message: `Clocked in to "${task.title}"` 
    };
  },
});

// Clock out from event task via voice
export const clockOutEventTaskFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.optional(v.id("events")),
    markComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Find running time entry
    const runningEntry = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRunning"), true))
      .first();

    if (!runningEntry) {
      throw new Error("You're not clocked in to any task");
    }

    const task = await ctx.db.get(runningEntry.taskId);
    if (!task) throw new Error("Task not found");

    // Calculate duration
    const duration = now - runningEntry.startTime;

    // End time entry
    await ctx.db.patch(runningEntry._id, {
      endTime: now,
      duration,
      isRunning: false,
    });

    // If markComplete, move to in_review
    if (args.markComplete) {
      await ctx.db.patch(task._id, {
        status: "in_review",
        updatedAt: now,
      });
    }

    // Clear user's current activity
    const metadata = (user.metadata as any) || {};
    await ctx.db.patch(args.userId, {
      metadata: {
        ...metadata,
        currentActivity: null,
      } as any,
    });

    const hours = Math.floor(duration / 3600000);
    const mins = Math.floor((duration % 3600000) / 60000);
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

    return { 
      success: true, 
      taskTitle: task.title,
      duration: durationStr,
      message: args.markComplete 
        ? `Clocked out from "${task.title}" after ${durationStr}. Task moved to In Review.`
        : `Clocked out from "${task.title}" after ${durationStr}.`
    };
  },
});

// Assign self to event task via voice
export const assignSelfToEventTask = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    taskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Find the task
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    const task = tasks.find(t => 
      t.title.toLowerCase().includes(args.taskTitle.toLowerCase())
    );

    if (!task) {
      const availableTasks = tasks.map(t => t.title).join(", ");
      throw new Error(`Task "${args.taskTitle}" not found. Available: ${availableTasks}`);
    }

    // Check if already assigned
    const existing = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task_user", (q) => 
        q.eq("taskId", task._id).eq("userId", args.userId)
      )
      .first();

    if (existing && existing.isActive) {
      throw new Error(`You're already assigned to "${task.title}"`);
    }

    // Create or reactivate assignment
    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        assignedAt: now,
      });
    } else {
      await ctx.db.insert("eventTaskAssignments", {
        taskId: task._id,
        userId: args.userId,
        assignedBy: args.userId,
        assignedAt: now,
        status: "assigned",
        isActive: true,
        progress: 0,
      });
    }

    return { 
      success: true, 
      taskTitle: task.title,
      message: `Assigned to "${task.title}". Say 'clock in' to start working.`
    };
  },
});

// Complete event task via voice (move to in_review)
export const completeEventTaskFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    taskTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get tasks for this event
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    let task;
    if (args.taskTitle) {
      task = tasks.find(t => 
        t.title.toLowerCase().includes(args.taskTitle!.toLowerCase())
      );
      if (!task) {
        throw new Error(`Task "${args.taskTitle}" not found`);
      }
    } else {
      // Find user's in_progress task
      const assignments = await ctx.db
        .query("eventTaskAssignments")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      const assignedTaskIds = assignments.map(a => a.taskId);
      task = tasks.find(t => 
        assignedTaskIds.includes(t._id) && 
        t.status === "in_progress"
      );
      
      if (!task) {
        throw new Error("No in-progress task found. Start working on a task first.");
      }
    }

    // Check if user is assigned
    const assignment = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task_user", (q) => 
        q.eq("taskId", task._id).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!assignment) {
      throw new Error(`You're not assigned to "${task.title}"`);
    }

    if (task.status === "done") {
      throw new Error(`"${task.title}" is already completed`);
    }

    if (task.status === "in_review") {
      throw new Error(`"${task.title}" is already in review`);
    }

    // Clock out if running
    const runningEntry = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("isRunning"), true)
        )
      )
      .first();

    if (runningEntry) {
      const duration = now - runningEntry.startTime;
      await ctx.db.patch(runningEntry._id, {
        endTime: now,
        duration,
        isRunning: false,
      });
    }

    // Move task to in_review
    await ctx.db.patch(task._id, {
      status: "in_review",
      updatedAt: now,
    });

    // Update assignment status
    await ctx.db.patch(assignment._id, {
      status: "completed",
      completedAt: now,
    });

    // Clear user's current activity
    const user = await ctx.db.get(args.userId);
    if (user) {
      const metadata = (user.metadata as any) || {};
      if (metadata.currentActivity?.id === task._id) {
        await ctx.db.patch(args.userId, {
          metadata: { ...metadata, currentActivity: null } as any,
        });
      }
    }

    return { 
      success: true, 
      taskTitle: task.title,
      message: `"${task.title}" marked complete and moved to In Review!`
    };
  },
});

// List event tasks via voice
export const listEventTasksFromVoice = internalQuery({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    filter: v.optional(v.string()), // "my", "todo", "in_progress", "all"
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Get user's assignments
    const assignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const myTaskIds = assignments.map(a => a.taskId);

    let filteredTasks = tasks;
    if (args.filter === "my") {
      filteredTasks = tasks.filter(t => myTaskIds.includes(t._id));
    } else if (args.filter === "todo") {
      filteredTasks = tasks.filter(t => t.status === "todo");
    } else if (args.filter === "in_progress") {
      filteredTasks = tasks.filter(t => t.status === "in_progress");
    }

    const event = await ctx.db.get(args.eventId);

    return {
      eventName: event?.title || "Event",
      tasks: filteredTasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        isMine: myTaskIds.includes(t._id),
      })),
      myTaskCount: tasks.filter(t => myTaskIds.includes(t._id)).length,
      totalCount: tasks.length,
    };
  },
});

// Move event task to different status via voice
export const moveEventTaskFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    taskTitle: v.string(),
    targetStatus: v.string(), // "todo", "in_progress", "in_review", "done", "blocked", "backlog"
    blockedReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Normalize target status
    const statusMap: Record<string, string> = {
      'to do': 'todo',
      'todo': 'todo',
      'in progress': 'in_progress',
      'in_progress': 'in_progress',
      'progress': 'in_progress',
      'in review': 'in_review',
      'in_review': 'in_review',
      'review': 'in_review',
      'done': 'done',
      'complete': 'done',
      'completed': 'done',
      'blocked': 'blocked',
      'block': 'blocked',
      'backlog': 'backlog',
    };
    
    const targetStatus = statusMap[args.targetStatus.toLowerCase()] || args.targetStatus.toLowerCase();
    const validStatuses = ['todo', 'in_progress', 'in_review', 'done', 'blocked', 'backlog'];
    
    if (!validStatuses.includes(targetStatus)) {
      throw new Error(`Invalid status "${args.targetStatus}". Valid: To Do, In Progress, In Review, Done, Blocked, Backlog`);
    }

    // Find the task
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    const task = tasks.find(t => 
      t.title.toLowerCase().includes(args.taskTitle.toLowerCase())
    );

    if (!task) {
      throw new Error(`Task "${args.taskTitle}" not found`);
    }

    // Check if user is assigned (for certain moves)
    const assignment = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task_user", (q) => 
        q.eq("taskId", task._id).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    // Rules for moving tasks
    const userRole = user.role?.toUpperCase() || 'WORKER';
    const isAdmin = ['ADMIN', 'CAPTAIN', 'MANAGER'].includes(userRole);
    
    // Workers can only move their assigned tasks
    if (!isAdmin && !assignment) {
      throw new Error(`You're not assigned to "${task.title}". Only assigned workers or managers can move it.`);
    }

    // Can't move from Done without manager approval
    if (task.status === 'done' && !isAdmin) {
      throw new Error(`"${task.title}" is already done. Only managers can reopen completed tasks.`);
    }

    // Can't move to Done directly - must go through In Review
    if (targetStatus === 'done' && task.status !== 'in_review') {
      throw new Error(`Tasks must go to "In Review" first before being marked Done.`);
    }

    // Moving to In Progress requires assignment
    if (targetStatus === 'in_progress' && !assignment && !isAdmin) {
      throw new Error(`You need to be assigned to "${task.title}" to move it to In Progress.`);
    }

    // If moving to blocked, need a reason
    if (targetStatus === 'blocked' && !args.blockedReason) {
      // Auto-generate a generic reason
      const reason = "Blocked via voice command";
      await ctx.db.patch(task._id, {
        status: targetStatus,
        blockedReason: reason,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(task._id, {
        status: targetStatus,
        blockedReason: targetStatus === 'blocked' ? args.blockedReason : undefined,
        updatedAt: now,
      });
    }

    // Log the move
    await ctx.db.insert("eventTaskComments", {
      taskId: task._id,
      userId: args.userId,
      comment: `Moved task to ${targetStatus.replace('_', ' ')} via voice`,
      type: "status_change",
      oldStatus: task.status,
      newStatus: targetStatus,
      mentions: [],
      createdAt: now,
      isEdited: false,
    });

    const statusDisplay = targetStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { 
      success: true, 
      taskTitle: task.title,
      oldStatus: task.status,
      newStatus: targetStatus,
      message: `Moved "${task.title}" to ${statusDisplay}!`
    };
  },
});

// Create event from voice command
export const createEventFromVoice = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Default to tomorrow at 2 PM if no date specified
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    const startDate = args.startDate || tomorrow.getTime();
    const endDate = args.endDate || (startDate + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description || `Event created via voice assistant`,
      type: (args.type as "meeting" | "community" | "project" | "emergency" | "milestone") || "community",
      startDate: startDate,
      endDate: endDate,
      location: args.location || "Barangay Hall",
      organizer: args.userId,
      attendees: [args.userId],
      isPublic: true,
      requiresApproval: false,
      allowPublicRSVP: true,
      allowDocumentUpload: false,
      status: "published",
      publicAttendees: [],
      attachments: [],
    });

    return { eventId, startDate, endDate };
  },
});

// Get milestone info for voice responses
export const getMilestoneInfo = internalQuery({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return null;
    return { name: milestone.title || milestone.name || "Milestone" };
  },
});

// Get project info for voice responses
export const getProjectInfo = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    return { name: project.title || project.name || "Project" };
  },
});

// ============================================
// MILESTONE KANBAN VOICE COMMANDS
// ============================================

// Get team members for a milestone's project (for assignment)
export const getMilestoneTeamMembers = internalQuery({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return [];
    
    // Get project to find team members
    const project = await ctx.db.get(milestone.projectId);
    if (!project) return [];
    
    // Get assigned team members
    const teamIds = project.assignedTo || [];
    const teamMembers = await Promise.all(
      teamIds.map(async (userId: Id<"users">) => {
        const user = await ctx.db.get(userId);
        return user ? { 
          id: user._id, 
          name: user.name || user.email || "Unknown",
          firstName: user.name?.split(' ')[0] || user.email?.split('@')[0] || "Unknown"
        } : null;
      })
    );
    
    return teamMembers.filter(Boolean);
  },
});

// Move task to a different column/status by title search (DYNAMIC COLUMNS)
export const moveTaskByTitle = internalMutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    taskTitle: v.string(),
    targetStatus: v.string(), // Can be column title like "In Review", "New Task", etc.
  },
  handler: async (ctx, args) => {
    // Find task in this milestone by title
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    const searchLower = args.taskTitle.toLowerCase();
    const matchingTask = tasks.find((t) =>
      t.title.toLowerCase().includes(searchLower)
    );
    
    if (!matchingTask) {
      return { success: false, message: `Task "${args.taskTitle}" not found in this milestone` };
    }
    
    // Get ACTUAL kanban columns for this milestone
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    // Find matching column by title (fuzzy match)
    const targetLower = args.targetStatus.toLowerCase().replace(/\s+/g, '');
    const targetColumn = columns.find((col) => {
      const colTitleLower = col.title.toLowerCase().replace(/\s+/g, '');
      const colKeyLower = col.statusKey.toLowerCase().replace(/\s+/g, '');
      return colTitleLower.includes(targetLower) || 
             targetLower.includes(colTitleLower) ||
             colKeyLower.includes(targetLower) ||
             targetLower.includes(colKeyLower);
    });
    
    if (!targetColumn) {
      const availableColumns = columns.map(c => c.title).join(", ");
      return { 
        success: false, 
        message: `Column "${args.targetStatus}" not found. Available columns: ${availableColumns}` 
      };
    }
    
    // Check if this is the "done" column (completed tasks)
    const isDoneColumn = targetColumn.statusKey === "done" || 
                         targetColumn.title.toLowerCase() === "done" ||
                         targetColumn.title.toLowerCase() === "completed";
    
    await ctx.db.patch(matchingTask._id, {
      status: targetColumn.statusKey,
      lastMovedBy: args.userId,
      ...(isDoneColumn ? { completed: true, completedAt: Date.now(), completedBy: args.userId } : { completed: false }),
    });
    
    return { 
      success: true, 
      message: `Moved "${matchingTask.title}" to ${targetColumn.title}!`,
      taskTitle: matchingTask.title,
      newStatus: targetColumn.statusKey,
      columnTitle: targetColumn.title,
    };
  },
});

// Delete task by title
export const deleteTaskByTitle = internalMutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    taskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    // Find task in this milestone by title
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    const searchLower = args.taskTitle.toLowerCase();
    const matchingTask = tasks.find((t) =>
      t.title.toLowerCase().includes(searchLower)
    );
    
    if (!matchingTask) {
      return { success: false, message: `Task "${args.taskTitle}" not found in this milestone` };
    }
    
    // Delete the task
    await ctx.db.delete(matchingTask._id);
    
    return { 
      success: true, 
      message: `Deleted task "${matchingTask.title}"!`,
      taskTitle: matchingTask.title,
    };
  },
});

// Assign task to a user by name
export const assignTaskByTitle = internalMutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    taskTitle: v.string(),
    assigneeName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find task in this milestone
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    const searchLower = args.taskTitle.toLowerCase();
    const matchingTask = tasks.find((t) =>
      t.title.toLowerCase().includes(searchLower)
    );
    
    if (!matchingTask) {
      return { success: false, message: `Task "${args.taskTitle}" not found` };
    }
    
    // Get milestone to find project team
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return { success: false, message: "Milestone not found" };
    
    const project = await ctx.db.get(milestone.projectId);
    if (!project) return { success: false, message: "Project not found" };
    
    // Find user by name from project team
    const teamIds = project.assignedTo || [];
    const teamMembers = await Promise.all(
      teamIds.map((id: Id<"users">) => ctx.db.get(id))
    );
    
    const assigneeNameLower = args.assigneeName.toLowerCase();
    const assignee = teamMembers.find((u) => 
      u && (
        u.name?.toLowerCase().includes(assigneeNameLower) ||
        u.name?.split(' ')[0]?.toLowerCase() === assigneeNameLower ||
        u.email?.toLowerCase().includes(assigneeNameLower)
      )
    );
    
    if (!assignee) {
      const teamNames = teamMembers.filter(Boolean).map(u => u!.name || u!.email).join(", ");
      return { 
        success: false, 
        message: `User "${args.assigneeName}" not found in team. Team members: ${teamNames || "none"}` 
      };
    }
    
    // Update task with new assignee (add to existing)
    const currentAssignees = matchingTask.assignedTo || [];
    if (!currentAssignees.includes(assignee._id)) {
      await ctx.db.patch(matchingTask._id, {
        assignedTo: [...currentAssignees, assignee._id],
      });
    }
    
    return { 
      success: true, 
      message: `Assigned "${matchingTask.title}" to ${assignee.name || assignee.email}!`,
      taskTitle: matchingTask.title,
      assigneeName: assignee.name || assignee.email,
    };
  },
});

// Start working on a task (move to in_progress column dynamically + set workingOnIt)
export const startWorkingOnTask = internalMutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    taskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    // Find task
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    const searchLower = args.taskTitle.toLowerCase();
    const matchingTask = tasks.find((t) =>
      t.title.toLowerCase().includes(searchLower)
    );
    
    if (!matchingTask) {
      return { success: false, message: `Task "${args.taskTitle}" not found` };
    }
    
    // Get columns to find "in progress" column
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    // Find "in progress" column (flexible matching)
    const inProgressColumn = columns.find((col) => {
      const keyLower = col.statusKey.toLowerCase();
      const titleLower = col.title.toLowerCase();
      return keyLower.includes("progress") || titleLower.includes("progress") ||
             keyLower === "in_progress" || keyLower === "inprogress";
    });
    
    const targetStatus = inProgressColumn?.statusKey || "in_progress";
    const targetTitle = inProgressColumn?.title || "In Progress";
    
    // Move to in_progress, assign to current user, and set workingOnIt
    const currentAssignees = matchingTask.assignedTo || [];
    const updates: any = {
      status: targetStatus,
      lastMovedBy: args.userId,
      workingOnIt: args.userId, // Set "Working On It" indicator
    };
    
    if (!currentAssignees.includes(args.userId)) {
      updates.assignedTo = [...currentAssignees, args.userId];
    }
    
    await ctx.db.patch(matchingTask._id, updates);
    
    return { 
      success: true, 
      message: `Started working on "${matchingTask.title}"! Task moved to ${targetTitle}.`,
      taskTitle: matchingTask.title,
    };
  },
});

// Stop working on a task (clear workingOnIt)
export const stopWorkingOnTask = internalMutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    taskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    // Find task
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    const searchLower = args.taskTitle.toLowerCase();
    const matchingTask = tasks.find((t) =>
      t.title.toLowerCase().includes(searchLower)
    );
    
    if (!matchingTask) {
      return { success: false, message: `Task "${args.taskTitle}" not found` };
    }
    
    // Clear workingOnIt
    await ctx.db.patch(matchingTask._id, {
      workingOnIt: undefined,
    });
    
    return { 
      success: true, 
      message: `Stopped working on "${matchingTask.title}".`,
      taskTitle: matchingTask.title,
    };
  },
});

// Create task with immediate assignment
export const createTaskWithAssignment = internalMutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    title: v.string(),
    assigneeName: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return { success: false, message: "Milestone not found" };
    
    const project = await ctx.db.get(milestone.projectId);
    if (!project) return { success: false, message: "Project not found" };
    
    // Get first column (usually "To Do") for default status
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    const sortedColumns = columns.sort((a, b) => (a.order || 0) - (b.order || 0));
    const firstColumn = sortedColumns[0];
    const defaultStatus = firstColumn?.statusKey || "todo";
    
    // Find assignee if specified
    let assigneeId: Id<"users"> | undefined;
    let assigneeName = "";
    
    if (args.assigneeName) {
      const teamIds = project.assignedTo || [];
      const teamMembers = await Promise.all(
        teamIds.map((id: Id<"users">) => ctx.db.get(id))
      );
      
      const searchName = args.assigneeName.toLowerCase();
      const assignee = teamMembers.find((u) => 
        u && (
          u.name?.toLowerCase().includes(searchName) ||
          u.name?.split(' ')[0]?.toLowerCase() === searchName
        )
      );
      
      if (assignee) {
        assigneeId = assignee._id;
        assigneeName = assignee.name || assignee.email || "";
      }
    }
    
    // Create task with dynamic status
    const taskId = await ctx.db.insert("tasks", {
      userId: args.userId,
      title: args.title,
      description: "",
      milestoneId: args.milestoneId,
      projectId: milestone.projectId,
      status: defaultStatus,
      priority: (args.priority as "low" | "medium" | "high" | "urgent") || "medium",
      completed: false,
      createdAt: Date.now(),
      createdBy: args.userId,
      assignedTo: assigneeId ? [assigneeId] : [args.userId],
      type: "todo",
      difficulty: "medium",
      storyPoints: 3,
      tags: [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      experienceReward: 10,
      goldReward: 5,
      completionCount: 0,
      loggedHours: [],
      isBlocking: false,
    });
    
    const response = assigneeName 
      ? `Task "${args.title}" created and assigned to ${assigneeName}!`
      : `Task "${args.title}" created on ${milestone.title || milestone.name}!`;
    
    return { 
      success: true, 
      message: response,
      taskId: String(taskId),
      milestoneName: milestone.title || milestone.name,
      assigneeName,
    };
  },
});

// List tasks in milestone by status
export const listMilestoneTasks = internalQuery({
  args: {
    milestoneId: v.id("milestones"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();
    
    if (args.status) {
      tasks = tasks.filter(t => t.status === args.status);
    }
    
    return tasks.map(t => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
    }));
  },
});

export const completeTaskByTitle = internalMutation({
  args: {
    userId: v.id("users"),
    titleSearch: v.string(),
  },
  handler: async (ctx, args) => {
    // Find task by title (case-insensitive partial match)
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .take(50);

    const searchLower = args.titleSearch.toLowerCase();
    const matchingTask = tasks.find((t) =>
      t.title.toLowerCase().includes(searchLower)
    );

    if (!matchingTask) {
      return { success: false, message: "Task not found" };
    }

    await ctx.db.patch(matchingTask._id, {
      completed: true,
      completedAt: Date.now(),
      completedBy: args.userId,
      status: "done",
    });

    return { success: true, message: `Marked "${matchingTask.title}" as complete!` };
  },
});

export const getTasksList = internalQuery({
  args: {
    userId: v.id("users"),
    filter: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .take(50);

    if (args.filter === "today") {
      tasks = tasks.filter((t) =>
        t.dueDate && t.dueDate >= today.getTime() && t.dueDate < tomorrow.getTime()
      );
    } else if (args.filter === "overdue") {
      tasks = tasks.filter((t) => t.dueDate && t.dueDate < today.getTime());
    }

    return tasks.map((t) => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status,
    }));
  },
});

export const getUnreadNotifications = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .take(10);

    return notifications.map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
    }));
  },
});

export const getTodaySchedule = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), today.getTime()),
          q.lt(q.field("startDate"), tomorrow.getTime())
        )
      )
      .take(20);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("completed"), false),
          q.gte(q.field("dueDate"), today.getTime()),
          q.lt(q.field("dueDate"), tomorrow.getTime())
        )
      )
      .take(20);

    return {
      events: events.map((e) => ({
        title: e.title,
        time: new Date(e.startDate).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        location: e.location,
      })),
      tasks: tasks.map((t) => ({
        title: t.title,
        priority: t.priority,
      })),
    };
  },
});

export const getUserProjects = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(20);

    const userProjects = projects.filter(
      (p) => p.assignedTo?.includes(args.userId) || p.createdBy === args.userId
    );

    return userProjects.map((p) => ({
      id: p._id,
      title: p.title,
      status: p.status,
      progress: p.progress,
    }));
  },
});

// Voice command response type
interface VoiceCommandResponse {
  success: boolean;
  transcription: string;
  response: string;
  action: string | null;
  language?: string;
  actionResult?: unknown;
  isWorkRelated?: boolean;
  error?: string;
}

// Transcription result type
interface TranscriptionResult {
  text: string;
  language: string;
}

// Main voice assistant action - orchestrates everything
export const handleVoiceCommand = action({
  args: {
    userId: v.id("users"),
    audioBase64: v.string(),
    mimeType: v.optional(v.string()),
    conversationHistory: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
    }))),
    // Context for linking created items to events/milestones/projects
    context: v.optional(v.object({
      eventId: v.optional(v.id("events")),
      milestoneId: v.optional(v.id("milestones")),
      projectId: v.optional(v.id("projects")),
    })),
  },
  handler: async (ctx, args): Promise<VoiceCommandResponse> => {
    try {
      // Step 1: Transcribe audio
      const transcription = await ctx.runAction(internal.voiceAssistant.transcribeAudioInternal, {
        audioBase64: args.audioBase64,
        mimeType: args.mimeType,
      }) as TranscriptionResult;

      if (!transcription.text || transcription.text.trim() === "") {
        return {
          success: false,
          transcription: "",
          response: "Hindi ko narinig. Paki-ulit po.",
          action: null,
        };
      }

      // Step 2: Process with Llama (pass context for task linking)
      const aiResult = await ctx.runAction(internal.voiceAssistant.processCommandInternal, {
        userId: args.userId,
        transcribedText: transcription.text,
        conversationHistory: args.conversationHistory,
        context: args.context,
      }) as VoiceCommandResult;

      // Step 3: Execute action if work-related
      let actionResult: unknown = null;
      if (aiResult.action) {
        actionResult = await ctx.runAction(internal.voiceAssistant.executeActionInternal, {
          userId: args.userId,
          action: aiResult.action,
          params: aiResult.params,
          context: args.context,
        });
      }

      return {
        success: true,
        transcription: transcription.text,
        language: transcription.language,
        response: aiResult.response,
        action: aiResult.action,
        actionResult,
        isWorkRelated: aiResult.isWorkRelated,
      };
    } catch (error) {
      console.error("Voice assistant error:", error);
      return {
        success: false,
        transcription: "",
        response: "May problema po. Paki-ulit.",
        action: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Internal versions for action chaining
export const transcribeAudioInternal = internalAction({
  args: {
    audioBase64: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured. Add GROQ_API_KEY to your Convex environment variables.");
    }

    // Convert base64 to blob
    const audioBuffer = base64ToArrayBuffer(args.audioBase64);
    const blob = new Blob([audioBuffer], { type: args.mimeType || "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Whisper API error:", errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return { text: result.text, language: result.language || "unknown" };
  },
});

// Direct command patterns for fast matching (bypass AI for common commands)
const DIRECT_COMMANDS: { patterns: RegExp[]; action: string; response: string; params?: Record<string, string> }[] = [
  // ========== TIMER COMMANDS ==========
  { patterns: [/stop\s*(my|the)?\s*timer/i, /itigil.*timer/i, /stop\s*working/i, /end\s*task/i, /stop\s*task/i], action: "stop_task_timer", response: "Stopping your timer!" },
  { patterns: [/what.*working\s*on/i, /current\s*task/i, /anong\s*task/i, /ano.*ginagawa/i], action: "check_current_task", response: "Checking..." },
  
  // ========== CLOCK IN/OUT (Global and Event Task) ==========
  { patterns: [/^clock\s*in$/i, /^time\s*in$/i, /^pasok$/i, /^pumasok$/i, /^start\s*working$/i], action: "event_clock_in", response: "Clocking in!" },
  { patterns: [/^clock\s*out$/i, /^time\s*out$/i, /^uwi\s*na$/i, /^out\s*na$/i, /^stop\s*working$/i], action: "event_clock_out", response: "Clocking out!" },
  { patterns: [/clock\s*out.*complete/i, /finish.*task/i, /done.*task/i, /tapos\s*na/i, /task\s*complete/i], action: "event_clock_out_complete", response: "Completing task..." },
  { patterns: [/check.*status/i, /work\s*status/i, /am\s*i\s*clocked/i, /naka.*clock/i], action: "check_work_status", response: "Checking status..." },
  
  // ========== EVENT TASK COMMANDS ==========
  { patterns: [/my\s*event\s*tasks?/i, /event\s*tasks?/i, /tasks?\s*here/i, /list\s*tasks?\s*here/i], action: "list_event_tasks", response: "Listing event tasks..." },
  
  // ========== TASK QUERIES ==========
  { patterns: [/my\s*tasks?/i, /list\s*tasks?/i, /mga\s*task/i, /show\s*tasks?/i], action: "list_tasks", response: "Here are your tasks..." },
  { patterns: [/due\s*today/i, /today.*due/i, /ano.*due.*today/i, /tasks?\s*today/i], action: "check_due_today", response: "Checking what's due..." },
  
  // ========== SCHEDULE & NOTIFICATIONS ==========
  { patterns: [/my\s*schedule/i, /check\s*schedule/i, /ano.*schedule/i, /today.*schedule/i], action: "check_schedule", response: "Checking schedule..." },
  { patterns: [/notification/i, /mga\s*notif/i, /unread/i, /alerts?/i], action: "check_notifications", response: "Checking notifications..." },
  
  // ========== PROJECT QUERIES ==========
  { patterns: [/my\s*projects?/i, /list\s*projects?/i, /mga\s*project/i], action: "list_projects", response: "Here are your projects..." },

  // ========== CREATE COMMANDS (Opens create modals with optional pre-filled data) ==========
  // These simple patterns just open the modal - name extraction happens in matchDirectCommand
  // Create Project - Opens project creation dialog
  { patterns: [/create\s*(a\s*)?(new\s*)?project/i, /new\s*project/i, /gumawa.*project/i, /add\s*project/i], 
    action: "navigate", response: "Opening project creation...", params: { route: "/projects?action=create" } },
  
  // Create Event - Opens event creation modal
  { patterns: [/create\s*(a\s*)?(new\s*)?event/i, /new\s*event/i, /gumawa.*event/i, /add\s*event/i, /schedule\s*(an?\s*)?event/i], 
    action: "navigate", response: "Opening event creation...", params: { route: "/events?action=create" } },
  
  // Create Milestone - Opens milestone creation in sprints
  { patterns: [/create\s*(a\s*)?(new\s*)?milestone/i, /new\s*milestone/i, /gumawa.*milestone/i, /add\s*milestone/i, /create\s*sprint/i], 
    action: "navigate", response: "Opening milestone creation...", params: { route: "/events/sprints?action=create" } },
  
  // Create Task (general - direct creation via AI)
  { patterns: [/create\s*task\s*(called|named|titled)?\s*.+/i, /add\s*task\s*.+/i, /gumawa.*task\s*.+/i], 
    action: "create_task", response: "Creating task..." },
  
  // Create Task at Event (general - will need event selection)
  { patterns: [/create\s*task\s*(at|for|sa)\s*event/i, /add\s*task\s*(to|sa)\s*event/i, /new\s*task\s*(for|sa)\s*event/i], 
    action: "navigate", response: "Please select an event first. Going to events...", params: { route: "/events?action=select_for_task" } },
  
  // Create Task at Milestone (general - will need milestone selection)  
  { patterns: [/create\s*task\s*(at|for|sa)\s*milestone/i, /add\s*task\s*(to|sa)\s*milestone/i, /new\s*task\s*(for|sa)\s*milestone/i], 
    action: "navigate", response: "Opening milestones kanban to add task...", params: { route: "/milestones/kanban?action=create_task" } },

  // ========== NAVIGATION (Basic pages) ==========
  { patterns: [/go.*(to\s*)?(the\s*)?dashboard/i, /open\s*dashboard/i], action: "navigate", response: "Going to Dashboard!", params: { route: "/dashboard" } },
  { patterns: [/go.*(to\s*)?home/i, /main\s*page/i], action: "navigate", response: "Going home!", params: { route: "/dashboard" } },
  { patterns: [/go.*analytics/i, /open\s*analytics/i], action: "navigate", response: "Opening Analytics!", params: { route: "/dashboard/analytics" } },
  { patterns: [/go.*project/i, /open\s*project/i], action: "navigate", response: "Opening Projects!", params: { route: "/projects" } },
  { patterns: [/go.*event/i, /open\s*event/i], action: "navigate", response: "Opening Events!", params: { route: "/events" } },
  { patterns: [/go.*message/i, /open\s*message/i, /chat/i], action: "navigate", response: "Opening Messages!", params: { route: "/messages" } },
  { patterns: [/go.*notif/i, /open\s*notif/i], action: "navigate", response: "Opening Notifications!", params: { route: "/notifications" } },
  { patterns: [/go.*document/i, /open\s*document/i, /files?/i], action: "navigate", response: "Opening Documents!", params: { route: "/documents" } },
  { patterns: [/go.*collab/i, /open\s*collab/i], action: "navigate", response: "Opening Collaboration!", params: { route: "/collaboration" } },
  { patterns: [/go.*profile/i, /open\s*profile/i, /my\s*profile/i], action: "navigate", response: "Opening Profile!", params: { route: "/profile" } },
  { patterns: [/go.*setting/i, /open\s*setting/i], action: "navigate", response: "Opening Settings!", params: { route: "/admin/settings" } },
  { patterns: [/go.*user/i, /manage\s*user/i, /accounts/i], action: "navigate", response: "Opening Users!", params: { route: "/admin/users" } },
  { patterns: [/pending.*approval/i, /approval/i], action: "navigate", response: "Opening Approvals!", params: { route: "/admin/pending-approvals" } },
  { patterns: [/go.*milestone/i, /kanban/i, /sprint\s*board/i], action: "navigate", response: "Opening Milestones!", params: { route: "/milestones/kanban" } },
  { patterns: [/team.*workload/i, /workload/i], action: "navigate", response: "Opening Workload!", params: { route: "/dashboard/team-workload" } },
  { patterns: [/go.*resident/i, /manage\s*resident/i], action: "navigate", response: "Opening Residents!", params: { route: "/admin/residents" } },
  { patterns: [/go.*household/i, /manage\s*household/i], action: "navigate", response: "Opening Households!", params: { route: "/admin/households" } },
  { patterns: [/go.*certificate/i, /open\s*certificate/i], action: "navigate", response: "Opening Certificates!", params: { route: "/admin/certificates" } },
  { patterns: [/go.*sprint/i, /event\s*sprint/i], action: "navigate", response: "Opening Sprints!", params: { route: "/events/sprints" } },
];

// Extract name from create commands like "create project called Team Building"
function extractNameFromCommand(text: string, type: "project" | "event" | "milestone" | "task"): string | null {
  const patterns = [
    new RegExp(`(?:create|new|add|gumawa).*?${type}.*?(?:called|named|titled|na)\\s+(.+)`, "i"),
    new RegExp(`(?:create|new|add|gumawa).*?${type}\\s+(.+)`, "i"),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted name
      let name = match[1].trim();
      // Remove trailing punctuation and common filler words
      name = name.replace(/[.!?]+$/, "").trim();
      // Remove phrases like "for me", "please", etc.
      name = name.replace(/\s+(for me|please|po|na|lang)$/i, "").trim();
      // Remove "and assign..." part if present
      name = name.replace(/\s+and\s+assign.*$/i, "").trim();
      if (name.length > 0 && name.length < 100) {
        return name;
      }
    }
  }
  return null;
}

// Extract move command: "move [task] to [column]"
function extractMoveCommand(text: string): { taskTitle: string; targetStatus: string } | null {
  const patterns = [
    /move\s+(?:task\s+)?["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /transfer\s+(?:task\s+)?["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /ilipat\s+(?:ang\s+)?["']?(.+?)["']?\s+sa\s+["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        taskTitle: match[1].trim(),
        targetStatus: match[2].trim(),
      };
    }
  }
  return null;
}

// Extract assign command: "assign [task] to [user]"
function extractAssignCommand(text: string): { taskTitle: string; assigneeName: string } | null {
  const patterns = [
    /assign\s+(?:task\s+)?["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /give\s+(?:task\s+)?["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /ibigay\s+(?:ang\s+)?["']?(.+?)["']?\s+(?:kay|sa)\s+["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        taskTitle: match[1].trim(),
        assigneeName: match[2].trim(),
      };
    }
  }
  return null;
}

// Extract start working command: "start working on [task]"
function extractStartWorkingCommand(text: string): string | null {
  const patterns = [
    /start\s+(?:working\s+)?(?:on\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /begin\s+(?:working\s+)?(?:on\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /work\s+on\s+(?:task\s+)?["']?(.+?)["']?$/i,
    /simulan\s+(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// Extract create with assignment: "create task [name] and assign to [user]"
function extractCreateWithAssignment(text: string): { title: string; assigneeName?: string } | null {
  // Pattern: create task X and assign to Y
  const withAssignPattern = /create\s+(?:a\s+)?(?:new\s+)?task\s+(?:called\s+|named\s+)?["']?(.+?)["']?\s+(?:and\s+)?assign(?:ed)?\s+(?:it\s+)?to\s+["']?(.+?)["']?$/i;
  const match = text.match(withAssignPattern);
  if (match && match[1] && match[2]) {
    return {
      title: match[1].trim(),
      assigneeName: match[2].trim(),
    };
  }
  return null;
}

// Extract complete/done command
function extractCompleteCommand(text: string): string | null {
  const patterns = [
    /(?:mark|complete|finish|done)\s+(?:task\s+)?["']?(.+?)["']?\s+(?:as\s+)?(?:done|complete|finished)?$/i,
    /["']?(.+?)["']?\s+(?:is\s+)?(?:done|complete|finished)$/i,
    /tapos\s+(?:na\s+)?(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// Extract delete command: "delete [task]" / "remove [task]"
function extractDeleteCommand(text: string): string | null {
  const patterns = [
    /(?:delete|remove|del)\s+(?:task\s+)?["']?(.+?)["']?$/i,
    /(?:burahin|tanggalin)\s+(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// Extract stop working command: "stop working on [task]"
function extractStopWorkingCommand(text: string): string | null {
  const patterns = [
    /stop\s+(?:working\s+)?(?:on\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /(?:pause|itigil)\s+(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// ========== EVENT TASK COMMAND EXTRACTORS ==========

// Extract "clock in to [task]" / "start [task]"
function extractClockInTaskCommand(text: string): string | null {
  const patterns = [
    /clock\s*in\s+(?:to\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /time\s*in\s+(?:to\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /start\s+(?:working\s+on\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /work\s+on\s+["']?(.+?)["']?$/i,
    /simulan\s+(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// Extract "assign me to [task]" / "take [task]"
function extractAssignSelfCommand(text: string): string | null {
  const patterns = [
    /assign\s+(?:me\s+)?(?:to\s+)?(?:task\s+)?["']?(.+?)["']?$/i,
    /take\s+(?:task\s+)?["']?(.+?)["']?$/i,
    /i['']?ll\s+(?:take|do)\s+["']?(.+?)["']?$/i,
    /kunin\s+(?:ko\s+)?(?:ang\s+)?["']?(.+?)["']?$/i,
    /ako\s+(?:na\s+)?(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// Extract "complete [task]" / "mark [task] done"
function extractCompleteEventTaskCommand(text: string): string | null {
  const patterns = [
    /complete\s+(?:task\s+)?["']?(.+?)["']?$/i,
    /mark\s+["']?(.+?)["']?\s+(?:as\s+)?(?:done|complete|finished)/i,
    /finish\s+(?:task\s+)?["']?(.+?)["']?$/i,
    /tapos\s+(?:na\s+)?(?:ang\s+)?["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0) return taskTitle;
    }
  }
  return null;
}

// Extract "move [task] to [status]" for event tasks
function extractMoveEventTaskCommand(text: string): { taskTitle: string; targetStatus: string } | null {
  const patterns = [
    /move\s+(?:task\s+)?["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /transfer\s+["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /put\s+["']?(.+?)["']?\s+(?:in|to)\s+["']?(.+?)["']?$/i,
    /send\s+["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i,
    /["']?(.+?)["']?\s+(?:to|->)\s+["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      const targetStatus = match[2].trim().replace(/[.!?]+$/, "");
      if (taskTitle.length > 0 && targetStatus.length > 0) {
        return { taskTitle, targetStatus };
      }
    }
  }
  return null;
}

// Extract "block [task]" command
function extractBlockTaskCommand(text: string): { taskTitle: string; reason?: string } | null {
  const patterns = [
    /block\s+(?:task\s+)?["']?(.+?)["']?(?:\s+because\s+(.+))?$/i,
    /["']?(.+?)["']?\s+is\s+blocked(?:\s+because\s+(.+))?$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim().replace(/[.!?]+$/, "");
      const reason = match[2]?.trim();
      if (taskTitle.length > 0) {
        return { taskTitle, reason };
      }
    }
  }
  return null;
}

// Extract navigation command: "go to [page/project/event/milestone]"
function extractNavigationCommand(text: string): { destination: string; type: string; name?: string } | null {
  const normalized = text.toLowerCase().trim();
  
  // Static page navigation patterns
  const staticPages: Record<string, string> = {
    'dashboard': '/dashboard',
    'home': '/dashboard',
    'projects': '/projects',
    'project list': '/projects',
    'all projects': '/projects',
    'events': '/events',
    'event list': '/events',
    'all events': '/events',
    'calendar': '/events/calendar',
    'sprints': '/events/sprints',
    'sprint board': '/events/sprints',
    'documents': '/documents',
    'document library': '/documents',
    'files': '/documents',
    'team': '/team',
    'members': '/team',
    'notifications': '/notifications',
    'settings': '/settings',
    'profile': '/settings/profile',
    'productivity': '/projects',
    'budget': '/budget',
    'analytics': '/analytics',
    'reports': '/reports',
    'invitations': '/invitations',
    'admin': '/admin',
  };
  
  // Check for static page navigation
  for (const [page, url] of Object.entries(staticPages)) {
    const patterns = [
      new RegExp(`^(?:go\\s+to|navigate\\s+to|open|show\\s+me|take\\s+me\\s+to)\\s+(?:the\\s+)?${page}$`, 'i'),
      new RegExp(`^${page}\\s+page$`, 'i'),
    ];
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return { destination: url, type: 'static', name: page };
      }
    }
  }
  
  // Dynamic navigation with explicit type: "go to project [name]" / "go to event [name]"
  const explicitPatterns = [
    { regex: /^(?:go\s+to|navigate\s+to|open)\s+(?:the\s+)?project\s+["']?(.+?)["']?$/i, type: 'project' },
    { regex: /^(?:go\s+to|navigate\s+to|open)\s+(?:the\s+)?event\s+["']?(.+?)["']?$/i, type: 'event' },
    { regex: /^(?:go\s+to|navigate\s+to|open)\s+(?:the\s+)?milestone\s+["']?(.+?)["']?$/i, type: 'milestone' },
    { regex: /^(?:go\s+to|navigate\s+to|open)\s+(?:the\s+)?kanban\s+(?:for\s+)?["']?(.+?)["']?$/i, type: 'kanban' },
    { regex: /^(?:show|view)\s+(?:the\s+)?project\s+["']?(.+?)["']?$/i, type: 'project' },
    { regex: /^(?:show|view)\s+(?:the\s+)?event\s+["']?(.+?)["']?$/i, type: 'event' },
    { regex: /^(?:show|view)\s+(?:the\s+)?milestone\s+["']?(.+?)["']?$/i, type: 'milestone' },
  ];
  
  for (const { regex, type } of explicitPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const name = match[1].trim().replace(/[.!?]+$/, "");
      if (name.length > 0) {
        return { destination: '', type, name };
      }
    }
  }
  
  // Generic navigation without type: "go to [name]" / "open [name]" 
  // Will search in events, projects, and milestones
  const genericPatterns = [
    /^(?:go\s+to|navigate\s+to|open)\s+(?:the\s+)?["']?(.+?)["']?$/i,
    /^(?:show|view)\s+["']?(.+?)["']?$/i,
  ];
  
  for (const pattern of genericPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/[.!?]+$/, "");
      // Exclude static page keywords
      const staticKeywords = ['dashboard', 'home', 'projects', 'events', 'documents', 'calendar', 
        'sprints', 'team', 'members', 'notifications', 'settings', 'profile', 'budget', 
        'analytics', 'reports', 'invitations', 'admin', 'document library', 'files'];
      if (name.length > 2 && !staticKeywords.includes(name.toLowerCase())) {
        return { destination: '', type: 'search', name };
      }
    }
  }
  
  return null;
}

// Match direct commands before AI processing
function matchDirectCommand(text: string): { action: string; response: string; params?: Record<string, string> } | null {
  const normalized = text.toLowerCase().trim();
  
  // ========== MILESTONE KANBAN COMMANDS (Priority) ==========
  
  // Move task: "move [task] to [column]"
  const moveCmd = extractMoveCommand(text);
  if (moveCmd) {
    return {
      action: "move_task",
      response: `Moving "${moveCmd.taskTitle}" to ${moveCmd.targetStatus}...`,
      params: { taskTitle: moveCmd.taskTitle, targetStatus: moveCmd.targetStatus },
    };
  }
  
  // Assign task: "assign [task] to [user]"
  const assignCmd = extractAssignCommand(text);
  if (assignCmd) {
    return {
      action: "assign_task",
      response: `Assigning "${assignCmd.taskTitle}" to ${assignCmd.assigneeName}...`,
      params: { taskTitle: assignCmd.taskTitle, assigneeName: assignCmd.assigneeName },
    };
  }
  
  // Start working: "start working on [task]"
  const startCmd = extractStartWorkingCommand(text);
  if (startCmd) {
    return {
      action: "start_working",
      response: `Starting work on "${startCmd}"...`,
      params: { taskTitle: startCmd },
    };
  }
  
  // Stop working: "stop working on [task]"
  const stopCmd = extractStopWorkingCommand(text);
  if (stopCmd) {
    return {
      action: "stop_working",
      response: `Stopping work on "${stopCmd}"...`,
      params: { taskTitle: stopCmd },
    };
  }
  
  // ========== EVENT TASK COMMANDS ==========
  
  // Clock in to specific task: "clock in to [task]" / "start [task]"
  const clockInTaskCmd = extractClockInTaskCommand(text);
  if (clockInTaskCmd) {
    return {
      action: "event_clock_in_task",
      response: `Clocking in to "${clockInTaskCmd}"...`,
      params: { taskTitle: clockInTaskCmd },
    };
  }
  
  // Assign self to task: "assign me to [task]" / "take [task]"
  const assignSelfCmd = extractAssignSelfCommand(text);
  if (assignSelfCmd) {
    return {
      action: "event_assign_self",
      response: `Assigning you to "${assignSelfCmd}"...`,
      params: { taskTitle: assignSelfCmd },
    };
  }
  
  // Complete event task: "complete [task]" / "finish [task]"
  const completeEventTaskCmd = extractCompleteEventTaskCommand(text);
  if (completeEventTaskCmd) {
    return {
      action: "event_complete_task",
      response: `Completing "${completeEventTaskCmd}"...`,
      params: { taskTitle: completeEventTaskCmd },
    };
  }
  
  // Move event task: "move [task] to [status]"
  const moveEventTaskCmd = extractMoveEventTaskCommand(text);
  if (moveEventTaskCmd) {
    return {
      action: "event_move_task",
      response: `Moving "${moveEventTaskCmd.taskTitle}" to ${moveEventTaskCmd.targetStatus}...`,
      params: { taskTitle: moveEventTaskCmd.taskTitle, targetStatus: moveEventTaskCmd.targetStatus },
    };
  }
  
  // Block event task: "block [task]"
  const blockTaskCmd = extractBlockTaskCommand(text);
  if (blockTaskCmd) {
    return {
      action: "event_block_task",
      response: `Blocking "${blockTaskCmd.taskTitle}"...`,
      params: { taskTitle: blockTaskCmd.taskTitle, reason: blockTaskCmd.reason || "" },
    };
  }
  
  // Create with assignment: "create task X and assign to Y"
  const createAssignCmd = extractCreateWithAssignment(text);
  if (createAssignCmd) {
    return {
      action: "create_task_with_assignment",
      response: `Creating "${createAssignCmd.title}" and assigning to ${createAssignCmd.assigneeName}...`,
      params: { title: createAssignCmd.title, assigneeName: createAssignCmd.assigneeName || "" },
    };
  }
  
  // Complete task: "mark [task] as done"
  const completeCmd = extractCompleteCommand(text);
  if (completeCmd) {
    return {
      action: "complete_milestone_task",
      response: `Marking "${completeCmd}" as done...`,
      params: { taskTitle: completeCmd },
    };
  }
  
  // Delete task: "delete [task]"
  const deleteCmd = extractDeleteCommand(text);
  if (deleteCmd) {
    return {
      action: "delete_task",
      response: `Deleting "${deleteCmd}"...`,
      params: { taskTitle: deleteCmd },
    };
  }
  
  // List tasks: "what tasks are in progress" / "show my tasks"
  if (/(?:what|which|show|list)\s+(?:tasks?|items?)\s+(?:are\s+)?(?:in\s+)?(\w+)/i.test(normalized)) {
    const match = normalized.match(/(?:in\s+)?(\w+)\s*$/);
    const status = match ? match[1] : "all";
    return {
      action: "list_milestone_tasks",
      response: `Listing tasks...`,
      params: { status },
    };
  }
  
  // ========== NAVIGATION COMMANDS ==========
  
  // Navigation: "go to [page/project/event/milestone]"
  const navCmd = extractNavigationCommand(text);
  if (navCmd) {
    if (navCmd.type === 'static') {
      return {
        action: "navigate",
        response: `Navigating to ${navCmd.name}...`,
        params: { route: navCmd.destination },
      };
    } else {
      // Dynamic navigation - need to resolve by name
      return {
        action: "navigate_dynamic",
        response: `Looking for ${navCmd.type} "${navCmd.name}"...`,
        params: { type: navCmd.type, name: navCmd.name || "" },
      };
    }
  }
  
  // ========== ORIGINAL CREATE COMMANDS ==========
  
  // Special handling for create commands with names
  // Check if this is a create command with a name to extract
  const createProjectMatch = /create\s*(a\s*)?(new\s*)?project/i.test(text);
  const createEventMatch = /create\s*(a\s*)?(new\s*)?event|schedule\s*(an?\s*)?event/i.test(text);
  const createMilestoneMatch = /create\s*(a\s*)?(new\s*)?milestone|create\s*sprint/i.test(text);
  const createTaskMatch = /create\s*(a\s*)?(new\s*)?task|add\s*task|gumawa.*task/i.test(text);
  
  // Extract names and modify routes for create commands
  if (createProjectMatch) {
    const name = extractNameFromCommand(text, "project");
    const route = name 
      ? `/projects?action=create&title=${encodeURIComponent(name)}`
      : "/projects?action=create";
    return { 
      action: "navigate", 
      response: name ? `Opening project creation for "${name}"...` : "Opening project creation...", 
      params: { route } 
    };
  }
  
  if (createEventMatch) {
    const name = extractNameFromCommand(text, "event");
    if (name) {
      // Direct event creation with extracted name
      return { 
        action: "create_event", 
        response: `Creating event "${name}"...`, 
        params: { title: name } 
      };
    }
    // No name - open the modal
    return { 
      action: "navigate", 
      response: "Opening event creation...", 
      params: { route: "/events?action=create" } 
    };
  }
  
  if (createMilestoneMatch) {
    const name = extractNameFromCommand(text, "milestone");
    const route = name 
      ? `/events/sprints?action=create&title=${encodeURIComponent(name)}`
      : "/events/sprints?action=create";
    return { 
      action: "navigate", 
      response: name ? `Opening milestone creation for "${name}"...` : "Opening milestone creation...", 
      params: { route } 
    };
  }
  
  // Create task - if name detected, return action for AI to process with extracted title
  if (createTaskMatch) {
    const name = extractNameFromCommand(text, "task");
    if (name) {
      return { 
        action: "create_task", 
        response: `Creating task "${name}"...`, 
        params: { title: name } 
      };
    }
    // No name extracted, let AI handle it
    return null;
  }
  
  // Standard pattern matching for other commands
  for (const cmd of DIRECT_COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(normalized)) {
        return { action: cmd.action, response: cmd.response, params: cmd.params };
      }
    }
  }
  return null;
}

export const processCommandInternal = internalAction({
  args: {
    userId: v.id("users"),
    transcribedText: v.string(),
    conversationHistory: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
    }))),
    // Context for linking created items to events/milestones/projects
    context: v.optional(v.object({
      eventId: v.optional(v.id("events")),
      milestoneId: v.optional(v.id("milestones")),
      projectId: v.optional(v.id("projects")),
    })),
  },
  handler: async (ctx, args): Promise<VoiceCommandResult> => {
    // FAST PATH: Try direct command matching first (no AI needed)
    const directMatch = matchDirectCommand(args.transcribedText);
    if (directMatch) {
      console.log("Direct command matched:", directMatch.action, directMatch.params);
      console.log("Context:", args.context);
      
      // For navigation commands, just return (frontend handles the navigation)
      if (directMatch.action === "navigate") {
        return {
          response: directMatch.response,
          action: directMatch.action,
          params: directMatch.params || {},
          isWorkRelated: true,
        };
      }
      
      // For dynamic navigation, resolve the name to an ID and return route
      if (directMatch.action === "navigate_dynamic" && directMatch.params?.name) {
        const navType = directMatch.params.type;
        const navName = directMatch.params.name;
        
        try {
          if (navType === "project") {
            // Find project by name
            const projects = await ctx.db.query("projects").collect();
            const project = projects.find(p => 
              p.title.toLowerCase().includes(navName.toLowerCase())
            );
            
            if (project) {
              return {
                response: `Opening project "${project.title}"...`,
                action: "navigate",
                params: { route: `/projects/${project._id}` },
                isWorkRelated: true,
              };
            } else {
              return {
                response: `I couldn't find a project named "${navName}". Try saying "go to projects" to see all projects.`,
                action: null,
                params: {},
                isWorkRelated: true,
              };
            }
          }
          
          if (navType === "event") {
            // Find event by name
            const events = await ctx.db.query("events").collect();
            const event = events.find(e => 
              e.title.toLowerCase().includes(navName.toLowerCase())
            );
            
            if (event) {
              return {
                response: `Opening event "${event.title}" control board...`,
                action: "navigate",
                params: { route: `/events/${event._id}/control` },
                isWorkRelated: true,
              };
            } else {
              return {
                response: `I couldn't find an event named "${navName}". Try saying "go to events" to see all events.`,
                action: null,
                params: {},
                isWorkRelated: true,
              };
            }
          }
          
          if (navType === "milestone" || navType === "kanban") {
            // Find milestone by name
            const milestones = await ctx.db.query("milestones").collect();
            const milestone = milestones.find(m => 
              m.title.toLowerCase().includes(navName.toLowerCase())
            );
            
            if (milestone) {
              const route = navType === "kanban" 
                ? `/milestones/${milestone._id}/kanban`
                : `/milestones/${milestone._id}/kanban`; // Milestones go to kanban by default
              return {
                response: `Opening ${navType === "kanban" ? "kanban board for" : "milestone"} "${milestone.title}"...`,
                action: "navigate",
                params: { route },
                isWorkRelated: true,
              };
            } else {
              return {
                response: `I couldn't find a milestone named "${navName}". Try navigating to a project first.`,
                action: null,
                params: {},
                isWorkRelated: true,
              };
            }
          }
          
          // Generic search - search in events, projects, and milestones by name
          if (navType === "search") {
            // Search events first (most common use case)
            const events = await ctx.db.query("events").collect();
            const event = events.find(e => 
              e.title.toLowerCase().includes(navName.toLowerCase())
            );
            
            if (event) {
              return {
                response: `Opening event "${event.title}"...`,
                action: "navigate",
                params: { route: `/events/${event._id}/control` },
                isWorkRelated: true,
              };
            }
            
            // Search projects
            const projects = await ctx.db.query("projects").collect();
            const project = projects.find(p => 
              p.title.toLowerCase().includes(navName.toLowerCase())
            );
            
            if (project) {
              return {
                response: `Opening project "${project.title}"...`,
                action: "navigate",
                params: { route: `/projects/${project._id}` },
                isWorkRelated: true,
              };
            }
            
            // Search milestones
            const milestones = await ctx.db.query("milestones").collect();
            const milestone = milestones.find(m => 
              m.title.toLowerCase().includes(navName.toLowerCase())
            );
            
            if (milestone) {
              return {
                response: `Opening milestone "${milestone.title}" kanban...`,
                action: "navigate",
                params: { route: `/milestones/${milestone._id}/kanban` },
                isWorkRelated: true,
              };
            }
            
            // Nothing found
            return {
              response: `I couldn't find "${navName}" in events, projects, or milestones. Try being more specific.`,
              action: null,
              params: {},
              isWorkRelated: true,
            };
          }
        } catch (error) {
          console.error("Navigation lookup error:", error);
          return {
            response: `Sorry, I couldn't find that ${navType}. Please try again.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // ========== EVENT TASK COMMAND HANDLERS ==========
      
      // Event Clock In (to assigned task)
      if (directMatch.action === "event_clock_in") {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board to clock in. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.clockInEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context.eventId,
          }) as { success: boolean; taskTitle: string; message: string };
          
          return {
            response: result.message,
            action: "event_clock_in",
            params: { taskTitle: result.taskTitle },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to clock in",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Event Clock In to specific task
      if (directMatch.action === "event_clock_in_task" && directMatch.params?.taskTitle) {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.clockInEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context.eventId,
            taskTitle: directMatch.params.taskTitle,
          }) as { success: boolean; taskTitle: string; message: string };
          
          return {
            response: result.message,
            action: "event_clock_in",
            params: { taskTitle: result.taskTitle },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to clock in",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Event Clock Out
      if (directMatch.action === "event_clock_out") {
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.clockOutEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context?.eventId,
            markComplete: false,
          }) as { success: boolean; taskTitle: string; duration: string; message: string };
          
          return {
            response: result.message,
            action: "event_clock_out",
            params: { taskTitle: result.taskTitle, duration: result.duration },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to clock out",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Event Clock Out and Complete
      if (directMatch.action === "event_clock_out_complete") {
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.clockOutEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context?.eventId,
            markComplete: true,
          }) as { success: boolean; taskTitle: string; duration: string; message: string };
          
          return {
            response: result.message,
            action: "event_clock_out_complete",
            params: { taskTitle: result.taskTitle, duration: result.duration },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to complete task",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Assign self to event task
      if (directMatch.action === "event_assign_self" && directMatch.params?.taskTitle) {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.assignSelfToEventTask, {
            userId: args.userId,
            eventId: args.context.eventId,
            taskTitle: directMatch.params.taskTitle,
          }) as { success: boolean; taskTitle: string; message: string };
          
          return {
            response: result.message,
            action: "event_assign_self",
            params: { taskTitle: result.taskTitle },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to assign task",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Complete event task
      if (directMatch.action === "event_complete_task") {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.completeEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context.eventId,
            taskTitle: directMatch.params?.taskTitle,
          }) as { success: boolean; taskTitle: string; message: string };
          
          return {
            response: result.message,
            action: "event_complete_task",
            params: { taskTitle: result.taskTitle },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to complete task",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Move event task
      if (directMatch.action === "event_move_task" && directMatch.params?.taskTitle) {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.moveEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context.eventId,
            taskTitle: directMatch.params.taskTitle,
            targetStatus: directMatch.params.targetStatus || "backlog",
          }) as { success: boolean; taskTitle: string; message: string };
          
          return {
            response: result.message,
            action: "event_move_task",
            params: { taskTitle: result.taskTitle },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to move task",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Block event task
      if (directMatch.action === "event_block_task" && directMatch.params?.taskTitle) {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.moveEventTaskFromVoice, {
            userId: args.userId,
            eventId: args.context.eventId,
            taskTitle: directMatch.params.taskTitle,
            targetStatus: "blocked",
            blockedReason: directMatch.params.reason || "Blocked via voice command",
          }) as { success: boolean; taskTitle: string; message: string };
          
          return {
            response: result.message,
            action: "event_block_task",
            params: { taskTitle: result.taskTitle },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to block task",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // List event tasks
      if (directMatch.action === "list_event_tasks") {
        if (!args.context?.eventId) {
          return {
            response: "You need to be on an event control board. Say 'go to [event name]' first.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        try {
          const result = await ctx.runQuery(internal.voiceAssistant.listEventTasksFromVoice, {
            userId: args.userId,
            eventId: args.context.eventId,
            filter: "my",
          }) as { eventName: string; tasks: any[]; myTaskCount: number; totalCount: number };
          
          if (result.tasks.length === 0) {
            return {
              response: `No tasks assigned to you in "${result.eventName}". Say 'assign me to [task name]' to take a task.`,
              action: "list_event_tasks",
              params: {},
              isWorkRelated: true,
            };
          }
          
          const taskList = result.tasks.map(t => `${t.title} (${t.status})`).join(", ");
          return {
            response: `Your ${result.myTaskCount} task(s) in "${result.eventName}": ${taskList}`,
            action: "list_event_tasks",
            params: { tasks: result.tasks },
            isWorkRelated: true,
          };
        } catch (error: any) {
          return {
            response: error.message || "Failed to list tasks",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // For database actions (create_task, create_event, etc.), execute them now
      if (directMatch.action === "create_task" && directMatch.params?.title) {
        try {
          // MUST have context - tasks should always belong to an event, milestone, or project
          if (!args.context?.eventId && !args.context?.milestoneId && !args.context?.projectId) {
            return {
              response: `I need to know where to create the task "${directMatch.params.title}". Please go to an Event, Milestone, or Project page first, then try again.`,
              action: null,
              params: {},
              isWorkRelated: true,
            };
          }
          
          // If on EVENT page → create in eventTasks table
          if (args.context?.eventId) {
            const result = await ctx.runMutation(internal.voiceAssistant.createEventTaskFromVoice, {
              userId: args.userId,
              eventId: args.context.eventId,
              title: directMatch.params.title,
              description: "",
              priority: "medium",
            }) as { taskId: unknown; eventName: string };
            
            console.log("Event task created via voice:", result.taskId, "event:", result.eventName);
            return {
              response: `Task "${directMatch.params.title}" created on ${result.eventName} event!`,
              action: "create_task",
              params: { title: directMatch.params.title, taskId: String(result.taskId), eventName: result.eventName },
              isWorkRelated: true,
            };
          }
          
          // If on MILESTONE page → create in tasks table with milestoneId
          if (args.context?.milestoneId) {
            // Get milestone name for response
            const milestone = await ctx.runQuery(internal.voiceAssistant.getMilestoneInfo, {
              milestoneId: args.context.milestoneId,
            }) as { name: string } | null;
            
            const taskId = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
              userId: args.userId,
              title: directMatch.params.title,
              description: "",
              priority: "medium",
              dueDate: undefined,
              milestoneId: args.context.milestoneId,
            });
            
            const milestoneName = milestone?.name || "this milestone";
            console.log("Milestone task created via voice:", taskId, "milestone:", milestoneName);
            return {
              response: `Task "${directMatch.params.title}" created on ${milestoneName}!`,
              action: "create_task",
              params: { title: directMatch.params.title, taskId: String(taskId), milestoneName },
              isWorkRelated: true,
            };
          }
          
          // If on PROJECT page → create in tasks table with projectId
          if (args.context?.projectId) {
            // Get project name for response
            const project = await ctx.runQuery(internal.voiceAssistant.getProjectInfo, {
              projectId: args.context.projectId,
            }) as { name: string } | null;
            
            const taskId = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
              userId: args.userId,
              title: directMatch.params.title,
              description: "",
              priority: "medium",
              dueDate: undefined,
              projectId: args.context.projectId,
            });
            
            const projectName = project?.name || "this project";
            console.log("Project task created via voice:", taskId, "project:", projectName);
            return {
              response: `Task "${directMatch.params.title}" created on ${projectName}!`,
              action: "create_task",
              params: { title: directMatch.params.title, taskId: String(taskId), projectName },
              isWorkRelated: true,
            };
          }
          
          // Fallback (shouldn't reach here)
          return {
            response: `Please navigate to an Event, Milestone, or Project page to create a task.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to create task:", error);
          return {
            response: "Sorry, I couldn't create the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }

      // Create event directly
      if (directMatch.action === "create_event" && directMatch.params?.title) {
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.createEventFromVoice, {
            userId: args.userId,
            title: directMatch.params.title,
          }) as { eventId: unknown; startDate: number; endDate: number };
          
          // Format the date for response
          const eventDate = new Date(result.startDate);
          const dateStr = eventDate.toLocaleDateString('en-PH', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          });
          const timeStr = eventDate.toLocaleTimeString('en-PH', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          
          console.log("Event created via direct command:", result.eventId);
          return {
            response: `Event "${directMatch.params.title}" created for ${dateStr} at ${timeStr}!`,
            action: "create_event",
            params: { 
              title: directMatch.params.title, 
              eventId: String(result.eventId),
              startDate: String(result.startDate)
            },
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to create event:", error);
          return {
            response: "Sorry, I couldn't create the event. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // ========== MILESTONE KANBAN COMMANDS ==========
      
      // Move task to different column
      if (directMatch.action === "move_task" && directMatch.params?.taskTitle && directMatch.params?.targetStatus) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to move tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.moveTaskByTitle, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            taskTitle: directMatch.params.taskTitle,
            targetStatus: directMatch.params.targetStatus,
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "move_task" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to move task:", error);
          return {
            response: "Sorry, I couldn't move the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Assign task to user
      if (directMatch.action === "assign_task" && directMatch.params?.taskTitle && directMatch.params?.assigneeName) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to assign tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.assignTaskByTitle, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            taskTitle: directMatch.params.taskTitle,
            assigneeName: directMatch.params.assigneeName,
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "assign_task" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to assign task:", error);
          return {
            response: "Sorry, I couldn't assign the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Start working on task
      if (directMatch.action === "start_working" && directMatch.params?.taskTitle) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to start working on tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.startWorkingOnTask, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            taskTitle: directMatch.params.taskTitle,
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "start_working" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to start working:", error);
          return {
            response: "Sorry, I couldn't start working on the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Stop working on task
      if (directMatch.action === "stop_working" && directMatch.params?.taskTitle) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to stop working on tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.stopWorkingOnTask, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            taskTitle: directMatch.params.taskTitle,
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "stop_working" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to stop working:", error);
          return {
            response: "Sorry, I couldn't stop working on the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Create task with assignment
      if (directMatch.action === "create_task_with_assignment" && directMatch.params?.title) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to create tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.createTaskWithAssignment, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            title: directMatch.params.title,
            assigneeName: directMatch.params.assigneeName || undefined,
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "create_task" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to create task:", error);
          return {
            response: "Sorry, I couldn't create the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Complete task in milestone
      if (directMatch.action === "complete_milestone_task" && directMatch.params?.taskTitle) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to complete tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.moveTaskByTitle, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            taskTitle: directMatch.params.taskTitle,
            targetStatus: "done",
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "complete_task" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to complete task:", error);
          return {
            response: "Sorry, I couldn't complete the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // Delete task
      if (directMatch.action === "delete_task" && directMatch.params?.taskTitle) {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to delete tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const result = await ctx.runMutation(internal.voiceAssistant.deleteTaskByTitle, {
            userId: args.userId,
            milestoneId: args.context.milestoneId,
            taskTitle: directMatch.params.taskTitle,
          }) as { success: boolean; message: string };
          
          return {
            response: result.message,
            action: result.success ? "delete_task" : null,
            params: directMatch.params,
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to delete task:", error);
          return {
            response: "Sorry, I couldn't delete the task. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // List milestone tasks
      if (directMatch.action === "list_milestone_tasks") {
        if (!args.context?.milestoneId) {
          return {
            response: `Please go to a Milestone page to list tasks.`,
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
        
        try {
          const tasks = await ctx.runQuery(internal.voiceAssistant.listMilestoneTasks, {
            milestoneId: args.context.milestoneId,
            status: directMatch.params?.status !== "all" ? directMatch.params?.status : undefined,
          }) as Array<{ title: string; status: string; priority: string }>;
          
          if (tasks.length === 0) {
            return {
              response: "No tasks found in this milestone.",
              action: "list_tasks",
              params: {},
              isWorkRelated: true,
            };
          }
          
          const taskList = tasks.slice(0, 5).map(t => `• ${t.title} (${t.status})`).join("\n");
          const moreText = tasks.length > 5 ? `\n...and ${tasks.length - 5} more` : "";
          
          return {
            response: `Found ${tasks.length} tasks:\n${taskList}${moreText}`,
            action: "list_tasks",
            params: { count: String(tasks.length) },
            isWorkRelated: true,
          };
        } catch (error) {
          console.error("Failed to list tasks:", error);
          return {
            response: "Sorry, I couldn't list the tasks. Please try again.",
            action: null,
            params: {},
            isWorkRelated: true,
          };
        }
      }
      
      // For other direct commands that don't need execution, return as-is
      return {
        response: directMatch.response,
        action: directMatch.action,
        params: directMatch.params || {},
        isWorkRelated: true,
      };
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not configured");
    }

    // Get user context
    const userContext = await ctx.runQuery(internal.voiceAssistant.getUserContext, {
      userId: args.userId,
    }) as unknown as {
      user: { name: string; department?: string; role?: string; position?: string; level?: number; xp?: number };
      tasks: { today: TaskItem[]; overdue: TaskItem[] };
      notifications: NotificationItem[];
      events: EventItem[];
      projects: ProjectItem[];
      currentTime: number;
      todayDate: string;
    } | null;

    if (!userContext) {
      return {
        response: "Sorry, I couldn't find your user profile. Please try again.",
        action: null,
        params: {},
        isWorkRelated: false,
      };
    }

    // Build context message
    const contextMessage: string = `
CURRENT USER CONTEXT:
- Name: ${userContext.user.name}
- Department: ${userContext.user.department || "Not set"}
- Role: ${userContext.user.role || "Worker"}
- Position: ${userContext.user.position || "Staff"}
- Level: ${userContext.user.level || 1}, XP: ${userContext.user.xp || 0}

TODAY'S DATE: ${userContext.todayDate}
CURRENT TIME: ${new Date(userContext.currentTime).toLocaleTimeString("en-PH")}

TASKS DUE TODAY (${userContext.tasks.today.length}):
${userContext.tasks.today.map((t: TaskItem) => `- ${t.title} (${t.priority})`).join("\n") || "No tasks due today"}

OVERDUE TASKS (${userContext.tasks.overdue.length}):
${userContext.tasks.overdue.map((t: TaskItem) => `- ${t.title}`).join("\n") || "No overdue tasks"}

UNREAD NOTIFICATIONS (${userContext.notifications.length}):
${userContext.notifications.map((n: NotificationItem) => `- ${n.title}: ${n.message}`).join("\n") || "No new notifications"}

TODAY'S EVENTS:
${userContext.events.map((e: EventItem) => `- ${e.title} at ${new Date(e.startDate).toLocaleTimeString("en-PH")}`).join("\n") || "No events today"}

ACTIVE PROJECTS:
${userContext.projects.map((p: ProjectItem) => `- ${p.title}`).join("\n") || "No active projects"}
`;

    // Prepare messages for Llama
    const systemPrompt = `You are "Aling" (short for Barangay Link Assistant), a helpful voice assistant for barangay workers.

PERSONALITY:
- Friendly, respectful, and efficient
- Speak in the same language the user uses (Tagalog, English, or mixed)
- Keep responses SHORT and CLEAR (1-3 sentences max)
- Be patient and helpful, especially for elderly users

YOUR CAPABILITIES (Work-Related - FULL ASSISTANCE):
1. ATTENDANCE: Clock in, clock out, check schedule, check attendance history
2. TASKS: Create tasks, list tasks, mark complete, assign tasks, check due dates
3. PROJECTS: Query project status, list projects, project details
4. EVENTS: Check events, RSVP, event details
5. NOTIFICATIONS: Read notifications, mark as read
6. USER INFO: Check user profile, check stats, XP, level

RESPONSE FORMAT FOR WORK COMMANDS:
When user wants to perform an action, respond with JSON:
{
  "action": "action_name",
  "params": { ... },
  "response": "What to say to user"
}

AVAILABLE ACTIONS:
- clock_in: Clock user in for work
- clock_out: Clock user out
- create_task: Create a new task (params: title, description?, priority?, dueDate?)
- list_tasks: List user's tasks (params: filter?: "today"|"overdue"|"all")
- complete_task: Mark task as done (params: taskTitle or title)
- list_projects: Show user's projects
- check_schedule: Show today's schedule
- check_notifications: Read unread notifications
- check_due_today: What's due today

FOR GENERAL QUESTIONS (Non-work):
- Give SIMPLE, dictionary-style answers (1-2 sentences)
- Examples:
  - "What is a dolphin?" → "A dolphin is an intelligent marine mammal that lives in oceans."
  - "Ilan ang days bago pasko?" → "May X araw pa bago ang Pasko." (calculate from current date)

IMPORTANT RULES:
1. If it's work-related → Parse into action JSON
2. If it's general knowledge → Give simple answer, no JSON
3. Never give long explanations unless specifically asked
4. Always be respectful (use "po" in Tagalog responses)`;

    const messages = [
      { role: "system", content: systemPrompt + "\n\n" + contextMessage },
      ...(args.conversationHistory || []),
      { role: "user", content: args.transcribedText },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Llama API error:", error);
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content || "";

    // Try to parse as JSON action
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (jsonMatch) {
        const actionData = JSON.parse(jsonMatch[0]);
        return {
          response: actionData.response,
          action: actionData.action,
          params: actionData.params || {},
          isWorkRelated: true,
        };
      }
    } catch {
      // Not a JSON response
    }

    return {
      response: aiResponse,
      action: null,
      params: {},
      isWorkRelated: false,
    };
  },
});

export const executeActionInternal = internalAction({
  args: {
    userId: v.id("users"),
    action: v.string(),
    params: v.any(),
    // Context for linking created items to events/milestones/projects
    context: v.optional(v.object({
      eventId: v.optional(v.id("events")),
      milestoneId: v.optional(v.id("milestones")),
      projectId: v.optional(v.id("projects")),
    })),
  },
  handler: async (ctx, args): Promise<ActionResult> => {
    const { userId, action, params, context } = args;

    switch (action) {
      case "clock_in": {
        const result = await ctx.runMutation(internal.voiceAssistant.recordAttendance, {
          userId,
          type: "clock_in",
        }) as { success: boolean; message: string };
        return result;
      }

      case "clock_out": {
        const result = await ctx.runMutation(internal.voiceAssistant.recordAttendance, {
          userId,
          type: "clock_out",
        }) as { success: boolean; message: string; duration?: number };
        return result;
      }

      case "check_work_status": {
        const status = await ctx.runQuery(internal.voiceAssistant.getWorkStatus, { userId });
        return { success: true, ...status };
      }

      case "stop_task_timer": {
        const result = await ctx.runMutation(internal.voiceAssistant.stopCurrentTaskTimer, {
          userId,
        }) as { success: boolean; message: string; taskTitle?: string; duration?: number };
        return result;
      }

      case "check_current_task": {
        const result = await ctx.runQuery(internal.voiceAssistant.getCurrentTask, { userId });
        return { 
          success: true, 
          hasActiveTask: result.hasActiveTask,
          taskName: result.taskName as string | undefined,
          taskMinutes: result.taskMinutes,
          eventName: result.eventName as string | undefined,
          message: result.message,
        };
      }

      case "navigate": {
        // Navigation is handled client-side, just return the route
        return { 
          success: true, 
          message: `Navigating to ${params.route}`,
          route: params.route,
        };
      }

      case "create_task": {
        const taskTitle = params.title || "Untitled Task";
        
        // MUST have context - tasks should always belong to an event, milestone, or project
        if (!context?.eventId && !context?.milestoneId && !context?.projectId) {
          return { 
            success: false, 
            message: `I need to know where to create "${taskTitle}". Please go to an Event, Milestone, or Project page first.` 
          };
        }
        
        // If on EVENT page → create in eventTasks table
        if (context?.eventId) {
          const result = await ctx.runMutation(internal.voiceAssistant.createEventTaskFromVoice, {
            userId,
            eventId: context.eventId,
            title: taskTitle,
            description: params.description || "",
            priority: params.priority || "medium",
          }) as { taskId: unknown; eventName: string };
          
          return { 
            success: true, 
            message: `Task "${taskTitle}" created on ${result.eventName} event!`, 
            taskId: result.taskId,
            eventName: result.eventName,
          };
        }
        
        // If on MILESTONE page → create in tasks table with milestoneId
        if (context?.milestoneId) {
          const milestone = await ctx.runQuery(internal.voiceAssistant.getMilestoneInfo, {
            milestoneId: context.milestoneId,
          }) as { name: string } | null;
          
          const taskId: unknown = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
            userId,
            title: taskTitle,
            description: params.description || "",
            priority: params.priority || "medium",
            dueDate: undefined,
            milestoneId: context.milestoneId,
          });
          
          const milestoneName = milestone?.name || "this milestone";
          return { 
            success: true, 
            message: `Task "${taskTitle}" created on ${milestoneName}!`, 
            taskId,
            milestoneName,
          };
        }
        
        // If on PROJECT page → create in tasks table with projectId
        if (context?.projectId) {
          const project = await ctx.runQuery(internal.voiceAssistant.getProjectInfo, {
            projectId: context.projectId,
          }) as { name: string } | null;
          
          const taskId: unknown = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
            userId,
            title: taskTitle,
            description: params.description || "",
            priority: params.priority || "medium",
            dueDate: undefined,
            projectId: context.projectId,
          });
          
          const projectName = project?.name || "this project";
          return { 
            success: true, 
            message: `Task "${taskTitle}" created on ${projectName}!`, 
            taskId,
            projectName,
          };
        }
        
        return { success: false, message: "Please navigate to an Event, Milestone, or Project page to create a task." };
      }

      case "complete_task": {
        const result = await ctx.runMutation(internal.voiceAssistant.completeTaskByTitle, {
          userId,
          titleSearch: params.taskTitle || params.title || "",
        }) as ActionResult;
        return result;
      }

      case "list_tasks": {
        const tasks: unknown = await ctx.runQuery(internal.voiceAssistant.getTasksList, {
          userId,
          filter: params.filter || "all",
        });
        return { success: true, tasks };
      }

      case "check_due_today": {
        const tasks: unknown = await ctx.runQuery(internal.voiceAssistant.getTasksList, {
          userId,
          filter: "today",
        });
        return { success: true, tasks };
      }

      case "check_notifications": {
        const notifications: unknown = await ctx.runQuery(internal.voiceAssistant.getUnreadNotifications, {
          userId,
        });
        return { success: true, notifications };
      }

      case "check_schedule": {
        const schedule: unknown = await ctx.runQuery(internal.voiceAssistant.getTodaySchedule, {
          userId,
        });
        return { success: true, schedule };
      }

      case "list_projects": {
        const projects: unknown = await ctx.runQuery(internal.voiceAssistant.getUserProjects, {
          userId,
        });
        return { success: true, projects };
      }

      default:
        return { success: false, message: "Action not recognized" };
    }
  },
});
