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
        const taskId: unknown = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
          userId,
          title: params.title || "Untitled Task",
          description: params.description || "",
          priority: params.priority || "medium",
          dueDate: params.dueDate,
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
          ? { type: "working", startedAt: now }
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
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      userId: args.userId,
      title: args.title,
      description: args.description || "",
      type: "todo",
      difficulty: "medium",
      status: "todo",
      priority: args.priority as "low" | "medium" | "high" | "urgent",
      completed: false,
      dueDate: args.dueDate,
      createdAt: Date.now(),
      createdBy: args.userId,
      assignedTo: [args.userId],
      experienceReward: 10,
      goldReward: 5,
      completionCount: 0,
      tags: [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      loggedHours: [],
      isBlocking: false,
    });

    return taskId;
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

      // Step 2: Process with Llama
      const aiResult = await ctx.runAction(internal.voiceAssistant.processCommandInternal, {
        userId: args.userId,
        transcribedText: transcription.text,
        conversationHistory: args.conversationHistory,
      }) as VoiceCommandResult;

      // Step 3: Execute action if work-related
      let actionResult: unknown = null;
      if (aiResult.action) {
        actionResult = await ctx.runAction(internal.voiceAssistant.executeActionInternal, {
          userId: args.userId,
          action: aiResult.action,
          params: aiResult.params,
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
  // === TASK TIMER COMMANDS ===
  {
    patterns: [
      /stop\s*(my|the)?\s*timer/i,
      /itigil\s*(mo|na)?\s*(ang|yung)?\s*timer/i,
      /stop\s*working/i,
      /tigil\s*na/i,
      /end\s*task/i,
      /clock\s*out\s*(from|on|sa)?\s*(my|the|current|this)?\s*task/i,
      /out\s*na\s*(sa|from)?\s*task/i,
      /stop\s*task/i,
    ],
    action: "stop_task_timer",
    response: "Stopping your task timer now!",
  },
  {
    patterns: [
      /what\s*(am\s*i|task)?\s*working\s*on/i,
      /anong\s*task\s*ko/i,
      /current\s*task/i,
      /ano\s*(yung|ang)?\s*ginagawa\s*ko/i,
    ],
    action: "check_current_task",
    response: "Let me check your current task...",
  },
  // === CLOCK IN/OUT COMMANDS ===
  {
    patterns: [/^clock\s*in$/i, /^time\s*in$/i, /^pasok\s*(na)?$/i, /^pumasok\s*(na)?$/i],
    action: "clock_in",
    response: "Clocking you in!",
  },
  {
    patterns: [/^clock\s*out$/i, /^time\s*out$/i, /^uwi\s*na$/i, /^out\s*na$/i],
    action: "clock_out",
    response: "Clocking you out!",
  },
  // === NAVIGATION COMMANDS ===
  // Dashboard
  {
    patterns: [/go\s*(to)?\s*(the)?\s*dashboard/i, /open\s*dashboard/i, /punta\s*(sa)?\s*dashboard/i, /show\s*(me)?\s*(the)?\s*dashboard/i],
    action: "navigate",
    response: "Going to Dashboard!",
    params: { route: "/dashboard" },
  },
  // Main Dashboard / Home
  {
    patterns: [/go\s*(to)?\s*(the)?\s*home/i, /go\s*home/i, /punta\s*(sa)?\s*home/i, /main\s*page/i],
    action: "navigate",
    response: "Going to Home!",
    params: { route: "/dashboard" },
  },
  // Analytics
  {
    patterns: [/go\s*(to)?\s*(the)?\s*analytics/i, /open\s*analytics/i, /show\s*(me)?\s*analytics/i, /punta\s*(sa)?\s*analytics/i],
    action: "navigate",
    response: "Going to Analytics!",
    params: { route: "/dashboard/analytics" },
  },
  // Projects / Productivity
  {
    patterns: [/go\s*(to)?\s*(the)?\s*projects?/i, /open\s*projects?/i, /show\s*(me)?\s*(my)?\s*projects?/i, /punta\s*(sa)?\s*projects?/i, /productivity/i],
    action: "navigate",
    response: "Going to Projects!",
    params: { route: "/productivity" },
  },
  // Events
  {
    patterns: [/go\s*(to)?\s*(the)?\s*events?/i, /open\s*events?/i, /show\s*(me)?\s*(the)?\s*events?/i, /punta\s*(sa)?\s*events?/i],
    action: "navigate",
    response: "Going to Events!",
    params: { route: "/events" },
  },
  // Messages
  {
    patterns: [/go\s*(to)?\s*(the)?\s*messages?/i, /open\s*messages?/i, /show\s*(me)?\s*(my)?\s*messages?/i, /punta\s*(sa)?\s*messages?/i, /chat/i],
    action: "navigate",
    response: "Going to Messages!",
    params: { route: "/messages" },
  },
  // Notifications
  {
    patterns: [/go\s*(to)?\s*(the)?\s*notifications?/i, /open\s*notifications?/i, /show\s*(me)?\s*(my)?\s*notifications?/i, /punta\s*(sa)?\s*notifications?/i],
    action: "navigate",
    response: "Going to Notifications!",
    params: { route: "/notifications" },
  },
  // Documents
  {
    patterns: [/go\s*(to)?\s*(the)?\s*documents?/i, /open\s*documents?/i, /show\s*(me)?\s*(the)?\s*documents?/i, /punta\s*(sa)?\s*documents?/i, /files?/i],
    action: "navigate",
    response: "Going to Documents!",
    params: { route: "/documents" },
  },
  // Collaboration
  {
    patterns: [/go\s*(to)?\s*(the)?\s*collaborat(ion|e)/i, /open\s*collaborat(ion|e)/i, /collab/i],
    action: "navigate",
    response: "Going to Collaboration!",
    params: { route: "/collaboration" },
  },
  // Profile
  {
    patterns: [/go\s*(to)?\s*(my)?\s*profile/i, /open\s*(my)?\s*profile/i, /show\s*(me)?\s*(my)?\s*profile/i, /punta\s*(sa)?\s*profile/i],
    action: "navigate",
    response: "Going to your Profile!",
    params: { route: "/profile" },
  },
  // Settings (Admin)
  {
    patterns: [/go\s*(to)?\s*(the)?\s*settings?/i, /open\s*settings?/i, /punta\s*(sa)?\s*settings?/i],
    action: "navigate",
    response: "Going to Settings!",
    params: { route: "/admin/settings" },
  },
  // Users / Accounts (Admin)
  {
    patterns: [/go\s*(to)?\s*(the)?\s*users?/i, /open\s*users?/i, /manage\s*users?/i, /accounts?/i],
    action: "navigate",
    response: "Going to User Management!",
    params: { route: "/admin/users" },
  },
  // Pending Approvals (Admin)
  {
    patterns: [/go\s*(to)?\s*(the)?\s*pending\s*approvals?/i, /pending\s*accounts?/i, /approvals?/i],
    action: "navigate",
    response: "Going to Pending Approvals!",
    params: { route: "/admin/pending-approvals" },
  },
  // Milestones / Kanban
  {
    patterns: [/go\s*(to)?\s*(the)?\s*milestones?/i, /open\s*milestones?/i, /kanban/i, /sprint\s*board/i],
    action: "navigate",
    response: "Going to Milestones!",
    params: { route: "/milestones/kanban" },
  },
  // Team Workload
  {
    patterns: [/go\s*(to)?\s*(the)?\s*team\s*workload/i, /workload/i, /team\s*tasks?/i],
    action: "navigate",
    response: "Going to Team Workload!",
    params: { route: "/dashboard/team-workload" },
  },
  // Residents (Admin)
  {
    patterns: [/go\s*(to)?\s*(the)?\s*residents?/i, /open\s*residents?/i, /manage\s*residents?/i],
    action: "navigate",
    response: "Going to Residents!",
    params: { route: "/admin/residents" },
  },
  // Households (Admin)
  {
    patterns: [/go\s*(to)?\s*(the)?\s*households?/i, /open\s*households?/i, /manage\s*households?/i],
    action: "navigate",
    response: "Going to Households!",
    params: { route: "/admin/households" },
  },
  // Certificates (Admin)
  {
    patterns: [/go\s*(to)?\s*(the)?\s*certificates?/i, /open\s*certificates?/i],
    action: "navigate",
    response: "Going to Certificates!",
    params: { route: "/admin/certificates" },
  },
];

// Match direct commands before AI processing
function matchDirectCommand(text: string): { action: string; response: string; params?: Record<string, string> } | null {
  const normalized = text.toLowerCase().trim();
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
  },
  handler: async (ctx, args): Promise<VoiceCommandResult> => {
    // FAST PATH: Try direct command matching first (no AI needed)
    const directMatch = matchDirectCommand(args.transcribedText);
    if (directMatch) {
      console.log("Direct command matched:", directMatch.action, directMatch.params);
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
        const taskId: unknown = await ctx.runMutation(internal.voiceAssistant.createTaskFromVoice, {
          userId,
          title: params.title || "Untitled Task",
          description: params.description || "",
          priority: params.priority || "medium",
          dueDate: params.dueDate,
        });
        return { success: true, message: "Task created!", taskId };
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
