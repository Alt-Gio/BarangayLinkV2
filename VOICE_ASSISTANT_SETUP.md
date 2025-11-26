# 🎤 Voice Assistant Setup Guide

## Overview

The Aling Voice Assistant is a multilingual voice-powered assistant that helps barangay workers manage tasks, clock in/out, check schedules, and answer general questions. It uses:

- **Whisper Large v3 Turbo** - For accurate speech-to-text (supports 100+ languages including Filipino/Tagalog)
- **Llama 3.1 8B Instant** - For understanding commands and generating responses

## Setup Steps

### 1. Get Groq API Key (FREE)

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Add API Key to Convex

**Option A: Via Convex Dashboard**
1. Go to [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `GROQ_API_KEY` = `your-api-key-here`

**Option B: Via CLI**
```bash
npx convex env set GROQ_API_KEY your-api-key-here
```

### 3. Deploy Changes

```bash
npx convex dev
```

## Usage

Once set up, users will see a floating green sparkle button (✨) in the bottom-right corner of the app.

### Voice Commands

**🧭 Navigation Commands (Direct - No AI Processing):**
| Say This | Action |
|----------|--------|
| "Go to Dashboard" | Navigate to Dashboard |
| "Go to Events" | Navigate to Events page |
| "Go to Projects" / "Open Projects" | Navigate to Projects/Productivity |
| "Go to Messages" / "Open Chat" | Navigate to Messages |
| "Go to Notifications" | Navigate to Notifications |
| "Go to Documents" / "Open Files" | Navigate to Documents |
| "Go to Profile" | Navigate to your Profile |
| "Go to Settings" | Navigate to Settings (Admin) |
| "Go to Analytics" | Navigate to Analytics |
| "Go to Milestones" / "Kanban" | Navigate to Milestones board |
| "Go to Team Workload" | Navigate to Team Workload |

**⏱️ Task Timer Commands:**
| Say This | Action |
|----------|--------|
| "Stop my timer" / "Stop timer" | Stops current task timer |
| "Stop working" / "Itigil timer" | Stops current task timer |
| "What am I working on?" | Shows current active task |
| "Current task" | Shows current active task |

**📋 Work Commands (Full Database Integration):**
| Say This | Action |
|----------|--------|
| "Clock in" / "Time in" / "Pasok na" | Records attendance clock-in |
| "Clock out" / "Time out" / "Uwi na" | Records attendance clock-out |
| "Ano due ko ngayon?" / "What's due today?" | Lists tasks due today |
| "Gumawa ng task na [title]" / "Create task [title]" | Creates a new task |
| "Tapos na ang [task name]" / "Complete [task name]" | Marks task as done |
| "Ano schedule ko?" / "What's my schedule?" | Shows today's events & tasks |
| "Mga notification ko" / "My notifications" | Reads unread notifications |
| "Mga projects ko" / "My projects" | Lists active projects |

**💬 General Questions (Simple Answers):**
| Say This | Response Style |
|----------|----------------|
| "What is a dolphin?" | "A dolphin is an intelligent marine mammal." |
| "Ilan ang days bago pasko?" | "May X araw pa bago ang Pasko." |
| "What's the capital of France?" | "Paris is the capital of France." |

## Features

### 🌍 Multi-Language Support
- Automatically detects language (Tagalog, English, Taglish)
- Responds in the same language the user speaks
- Handles mixed languages naturally

### 👴 Elder-Friendly
- Simple, clear responses (1-3 sentences)
- Uses respectful language ("po" in Tagalog)
- Slow, clear text-to-speech

### 💼 Work-Focused
- Full database integration for work tasks
- Real-time data from user's profile
- Executes actual database operations

### 🔒 Privacy
- Audio processed securely via Groq API
- No audio stored permanently
- Conversation history stays in browser session

## Cost Estimate

| Usage | Cost |
|-------|------|
| 100 voice commands/day | ~$0.40/day |
| Monthly (3000 commands) | ~$15/month |

Groq offers a generous free tier that's sufficient for small teams.

## Troubleshooting

### "GROQ_API_KEY not configured"
- Make sure you've added the API key to Convex environment variables
- Redeploy with `npx convex dev`

### Microphone not working
- Make sure browser has microphone permission
- Check if another app is using the microphone
- Try Chrome or Edge (best Web Speech API support)

### Speech not detected
- Speak clearly and close to the microphone
- Reduce background noise
- Check if the recording indicator is active (pulsing red)

### Wrong language detected
- Whisper auto-detects language, but you can speak more clearly
- Mixing languages too much might confuse detection

## Architecture

```
User Voice → Browser Audio Recording → Base64 Encoding
     ↓
Convex Action (handleVoiceCommand)
     ↓
Whisper Large v3 Turbo (Groq API)
     ↓
Transcribed Text
     ↓
Llama 3.1 8B Instant (Groq API)
     ↓
Parse Intent & Generate Response
     ↓
Execute Database Action (if work-related)
     ↓
Return Response → Text-to-Speech → User Hears Response
```

## Files Created

- `convex/voiceAssistant.ts` - Backend actions & mutations
- `src/hooks/useVoiceAssistant.ts` - React hook for voice logic
- `src/components/voice/VoiceAssistant.tsx` - UI component
- `src/components/voice/VoiceAssistantProvider.tsx` - Provider for global access
- `src/components/voice/index.ts` - Exports

## Customization

### Adding New Commands

Edit `convex/voiceAssistant.ts`:

1. Add action name to the AVAILABLE ACTIONS list in the system prompt
2. Add case handler in `executeActionInternal`
3. Create corresponding internal mutation/query if needed

### Changing Personality

Modify the `SYSTEM_PROMPT` in `convex/voiceAssistant.ts` to adjust:
- Response style
- Language preferences
- Personality traits
- Work vs general question handling

---

**Support:** Contact the development team for assistance.
