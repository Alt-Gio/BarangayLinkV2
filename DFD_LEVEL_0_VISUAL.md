# BARANGAYLINK V2 - DATA FLOW DIAGRAM LEVEL 0 (VISUAL)

## Mermaid Diagram - Copy to Mermaid Live Editor for Visualization

You can visualize this diagram at: https://mermaid.live/

```mermaid
graph TB
    %% External Entities - Users
    subgraph USERS["👥 INTERNAL USERS"]
        ADMIN["🔑 BARANGAY OFFICIALS<br/>(Admin/Captain)"]
        MANAGER["👔 DEPARTMENT MANAGERS"]
        BUILDER["🔨 BUILDERS"]
        WORKER["👷 WORKERS"]
    end
    
    subgraph PUBLIC["🌐 EXTERNAL USERS"]
        RESIDENT["👨‍👩‍👧‍👦 RESIDENTS<br/>(Public)"]
    end
    
    %% External Systems
    subgraph EXTERNAL["🔌 EXTERNAL SYSTEMS"]
        CLERK["🔐 CLERK<br/>(Auth)"]
        RESEND["📧 RESEND<br/>(Email)"]
        LIVEBLOCKS["⚡ LIVEBLOCKS<br/>(Real-time)"]
        FIREBASE["🔔 FIREBASE<br/>(Push Notif)"]
        MAPBOX["🗺️ MAPBOX<br/>(Maps)"]
        MESSENGER["💬 FACEBOOK<br/>MESSENGER"]
    end
    
    %% Core System
    subgraph SYSTEM["💻 BARANGAYLINK V2 SYSTEM"]
        %% Main Processes
        P1["1.0<br/>USER MGMT &<br/>AUTHENTICATION"]
        P2["2.0<br/>PROJECT<br/>MANAGEMENT"]
        P3["3.0<br/>TASK MGMT<br/>(GAMIFIED)"]
        P4["4.0<br/>EVENT<br/>MANAGEMENT"]
        P5["5.0<br/>MILESTONE &<br/>SPRINT MGMT"]
        P6["6.0<br/>DOCUMENT<br/>MANAGEMENT"]
        P7["7.0<br/>MESSAGING &<br/>COLLABORATION"]
        P8["8.0<br/>NOTIFICATION<br/>SYSTEM"]
        P9["9.0<br/>FINANCIAL<br/>TRACKING"]
        P10["10.0<br/>PUBLIC<br/>ENGAGEMENT"]
        P11["11.0<br/>ANALYTICS &<br/>REPORTING"]
        P12["12.0<br/>BACKUP &<br/>SECURITY"]
        
        %% Data Stores
        subgraph DATASTORE["🗄️ DATA STORES (CONVEX DATABASE)"]
            DS1[("👤 USERS<br/>UserLevels<br/>Departments")]
            DS2[("📊 PROJECTS<br/>Milestones<br/>ProjectActivities")]
            DS3[("✅ TASKS<br/>KanbanColumns<br/>UserStats")]
            DS4[("📅 EVENTS<br/>EventTasks<br/>Assignments")]
            DS5[("📄 DOCUMENTS<br/>Files<br/>Tags")]
            DS6[("💬 MESSAGES<br/>ChatRooms<br/>MessageSync")]
            DS7[("🔔 NOTIFICATIONS<br/>EmailQueue<br/>PushSubscriptions")]
            DS8[("💰 FINANCIALS<br/>Expenses<br/>Budget")]
            DS9[("📝 FEEDBACK<br/>OTP<br/>PublicStats")]
            DS10[("📈 ANALYTICS<br/>AuditLogs<br/>Sessions")]
        end
    end
    
    %% User Flows to System
    ADMIN -->|Registration/Login| P1
    MANAGER -->|Registration/Login| P1
    BUILDER -->|Registration/Login| P1
    WORKER -->|Registration/Login| P1
    RESIDENT -->|Registration| P1
    
    MANAGER -->|Create/Manage Projects| P2
    BUILDER -->|Create/View Projects| P2
    ADMIN -->|Approve Projects| P2
    
    MANAGER -->|Create/Assign Tasks| P3
    WORKER -->|Update Task Status| P3
    BUILDER -->|Execute Tasks| P3
    
    ADMIN -->|Create Events| P4
    MANAGER -->|Organize Events| P4
    RESIDENT -->|RSVP to Events| P4
    
    MANAGER -->|Create Milestones| P5
    BUILDER -->|Work on Sprints| P5
    
    ADMIN -->|Upload Documents| P6
    MANAGER -->|Manage Documents| P6
    WORKER -->|View Documents| P6
    
    ADMIN -->|Send Messages| P7
    MANAGER -->|Chat with Team| P7
    WORKER -->|Communicate| P7
    
    RESIDENT -->|Submit Feedback| P10
    RESIDENT -->|View Public Projects| P10
    
    ADMIN -->|View Analytics| P11
    MANAGER -->|View Reports| P11
    
    ADMIN -->|Manage Security| P12
    ADMIN -->|Create Backups| P12
    
    %% External System Integrations
    CLERK <-->|Webhooks<br/>Auth Requests| P1
    RESEND <--|Invitation Emails<br/>Notifications<br/>OTP| P1
    RESEND <--|Event Confirmations| P4
    RESEND <--|Task Notifications| P8
    RESEND <--|Feedback Confirmations| P10
    
    LIVEBLOCKS <-->|Real-time Sync<br/>Presence| P7
    LIVEBLOCKS <-->|Collaborative Editing| P2
    
    FIREBASE <--|Push Notifications| P8
    
    MAPBOX <--|Location Display| P2
    MAPBOX <--|Event Locations| P4
    
    MESSENGER <-->|Message Sync| P7
    
    %% Process to Data Store Flows
    P1 <-->|User Records| DS1
    P2 <-->|Project Data| DS2
    P3 <-->|Task Data| DS3
    P4 <-->|Event Data| DS4
    P5 <-->|Milestone Data| DS2
    P5 <-->|Sprint Tasks| DS3
    P6 <-->|Document Metadata| DS5
    P7 <-->|Messages| DS6
    P8 <-->|Notifications| DS7
    P9 <-->|Financial Records| DS8
    P10 <-->|Feedback & OTP| DS9
    P11 <-->|Analytics Data| DS10
    P12 <-->|Backups & Security| DS10
    
    %% Inter-Process Flows
    P1 -->|User Info| P2
    P1 -->|User Info| P3
    P1 -->|User Info| P4
    
    P2 -->|Project Context| P3
    P2 -->|Project Context| P5
    P2 -->|Project Data| P9
    
    P3 -->|Task Completion| P2
    P3 -->|Gamification Events| P8
    
    P4 -->|Event Tasks| P3
    
    P5 -->|Milestone Tasks| P3
    P5 -->|Progress Updates| P2
    
    P2 -->|Document Links| P6
    P3 -->|Task Attachments| P6
    P4 -->|Event Documents| P6
    
    P1 -->|User Events| P11
    P2 -->|Project Events| P11
    P3 -->|Task Events| P11
    P4 -->|Event Tracking| P11
    
    P1 -.->|Approval Notifications| P8
    P2 -.->|Assignment Notifications| P8
    P3 -.->|Task Notifications| P8
    P4 -.->|Event Reminders| P8
    P5 -.->|Milestone Alerts| P8
    P10 -.->|Feedback Confirmations| P8
    
    %% Output Flows
    P1 -->|Account Status| ADMIN
    P1 -->|Account Status| MANAGER
    P1 -->|Account Status| WORKER
    P1 -->|Account Status| BUILDER
    
    P2 -->|Project Updates| MANAGER
    P2 -->|Assignments| WORKER
    P2 -->|Progress Reports| ADMIN
    
    P3 -->|Task Updates| WORKER
    P3 -->|Completion Alerts| MANAGER
    P3 -->|Rewards (XP/Gold)| WORKER
    
    P4 -->|Event Info| RESIDENT
    P4 -->|RSVP Confirmations| RESIDENT
    
    P8 -->|Notifications| ADMIN
    P8 -->|Notifications| MANAGER
    P8 -->|Notifications| WORKER
    P8 -->|Notifications| BUILDER
    
    P10 -->|Public Project Info| RESIDENT
    P10 -->|Feedback Confirmation| RESIDENT
    
    P11 -->|Reports| ADMIN
    P11 -->|Analytics| MANAGER
    
    %% Styling
    classDef userClass fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef publicClass fill:#10b981,stroke:#059669,color:#fff
    classDef externalClass fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef processClass fill:#f59e0b,stroke:#d97706,color:#fff
    classDef datastoreClass fill:#ec4899,stroke:#be185d,color:#fff
    
    class ADMIN,MANAGER,BUILDER,WORKER userClass
    class RESIDENT publicClass
    class CLERK,RESEND,LIVEBLOCKS,FIREBASE,MAPBOX,MESSENGER externalClass
    class P1,P2,P3,P4,P5,P6,P7,P8,P9,P10,P11,P12 processClass
    class DS1,DS2,DS3,DS4,DS5,DS6,DS7,DS8,DS9,DS10 datastoreClass
```

---

## Simplified Context Diagram

```mermaid
graph LR
    %% External Entities
    USERS["👥 ALL USERS<br/>(Officials/Managers/<br/>Builders/Workers)"]
    RESIDENTS["👨‍👩‍👧‍👦 RESIDENTS<br/>(Public)"]
    EXTERNAL["🔌 EXTERNAL<br/>SYSTEMS<br/>(Clerk/Resend/<br/>Liveblocks/etc)"]
    
    %% System
    SYSTEM["💻 BARANGAYLINK V2<br/>PROJECT MANAGEMENT<br/>SYSTEM"]
    
    %% Flows
    USERS -->|Login/Register<br/>Create Projects/Tasks<br/>Manage Events<br/>Collaborate| SYSTEM
    RESIDENTS -->|View Public Info<br/>RSVP Events<br/>Submit Feedback| SYSTEM
    EXTERNAL <-->|Auth/Email/Notifications<br/>Real-time Sync<br/>Push/Maps| SYSTEM
    
    SYSTEM -->|Notifications<br/>Reports<br/>Updates<br/>Gamification| USERS
    SYSTEM -->|Public Projects<br/>Event Info<br/>Confirmations| RESIDENTS
    
    %% Styling
    classDef userClass fill:#3b82f6,stroke:#1e40af,color:#fff,stroke-width:3px
    classDef publicClass fill:#10b981,stroke:#059669,color:#fff,stroke-width:3px
    classDef externalClass fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:3px
    classDef systemClass fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:4px,font-size:14px
    
    class USERS userClass
    class RESIDENTS publicClass
    class EXTERNAL externalClass
    class SYSTEM systemClass
```

---

## Critical Workflow: Project Lifecycle

```mermaid
sequenceDiagram
    participant M as Manager
    participant A as Admin
    participant S as System
    participant W as Worker
    participant R as Resident
    participant E as Email Service
    
    M->>S: 1. Create Project
    S->>S: Save to DB (status: pending_approval)
    S->>A: Notify Admin for Approval
    
    A->>S: 2. Approve Project
    S->>S: Update status to 'approved'
    S->>E: Send approval notification
    E->>M: Approval Email
    
    M->>S: 3. Assign Team Members
    S->>S: Update project.assignedTo[]
    S->>E: Send assignment notifications
    E->>W: Assignment Email
    
    M->>S: 4. Create Milestone & Tasks
    S->>S: Create milestone + kanban columns
    S->>S: Create tasks with assignments
    S->>E: Notify assigned workers
    E->>W: Task Assignment Email
    
    W->>S: 5. Update Task Status (Kanban)
    S->>S: Validate column rules
    S->>S: Update task.status
    S->>S: Calculate project progress
    
    W->>S: 6. Mark Task Complete
    S->>S: Set task.completed = true
    S->>M: Notify Manager for verification
    
    M->>S: 7. Verify Task Completion
    S->>S: Set task.completedBy = manager
    S->>S: Award XP/Gold to worker
    S->>W: Achievement notification
    
    M->>S: 8. Mark Project Complete
    S->>S: Update status to 'completed'
    S->>S: Generate completion report
    S->>A: Notify Admin
    
    S->>S: 9. Make Project Public
    R->>S: View on Landing Page
    R->>S: Submit Feedback
    S->>E: Send OTP for verification
    E->>R: OTP Email
    R->>S: Verify OTP & Submit
    S->>S: Save feedback (status: pending)
    
    A->>S: 10. Moderate Feedback
    S->>S: Approve feedback
    S->>R: Public display on project page
```

---

## Authentication & User Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant C as Clerk
    participant S as System
    participant A as Admin
    participant E as Resend
    
    U->>C: 1. Register
    C->>C: Create Clerk Account
    C->>S: Webhook: user.created
    
    S->>S: Create User (status: pending)
    S->>S: Insert to users table
    S->>E: Send pending notification
    E->>U: "Registration Pending" Email
    
    A->>S: 2. Review Pending Users
    S->>A: Return pending users list
    
    A->>S: 3. Approve User
    S->>S: Update user.status = 'active'
    S->>S: Set user.approvedBy = admin
    S->>S: Set user.approvedAt = timestamp
    S->>E: Send approval email
    E->>U: "Account Approved" Email
    
    U->>C: 4. Login
    C->>C: Validate credentials
    C->>U: Return session token
    
    U->>S: 5. Access Dashboard
    S->>S: Check user.status == 'active'
    S->>S: Load user projects/tasks
    S->>U: Render dashboard
    
    Note over U,S: User can now work on assigned tasks
```

---

## Task Management Kanban Flow

```mermaid
stateDiagram-v2
    [*] --> BACKLOG: Task Created
    BACKLOG --> TODO: Ready to Start
    TODO --> IN_PROGRESS: Worker Starts
    IN_PROGRESS --> TODO: Needs Revision
    IN_PROGRESS --> IN_REVIEW: Worker Completes
    IN_REVIEW --> IN_PROGRESS: Manager Rejects
    IN_REVIEW --> DONE: Manager Approves
    DONE --> [*]: Verified & Rewarded
    
    note right of BACKLOG
        No validation rules
        Can freely move
    end note
    
    note right of TODO
        Requires: Assignment
        (configurable per column)
    end note
    
    note right of IN_PROGRESS
        Locked once started
        Cannot go back
        Requires: Description
    end note
    
    note right of IN_REVIEW
        Locked for review
        Only Manager can approve
        Requires: All fields
    end note
    
    note right of DONE
        Locked forever
        Awards XP/Gold
        Updates project progress
    end note
```

---

## Real-time Collaboration Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ CLIENT BROWSER"]
        UI["React UI"]
        CONVEX_CLIENT["Convex Client"]
        LIVEBLOCKS_CLIENT["Liveblocks Client"]
    end
    
    subgraph CONVEX["⚡ CONVEX BACKEND"]
        QUERIES["Reactive Queries"]
        MUTATIONS["Mutations"]
        DB[("Database")]
    end
    
    subgraph LIVEBLOCKS["🔄 LIVEBLOCKS"]
        PRESENCE["Presence"]
        ROOMS["Rooms"]
        CURSORS["Live Cursors"]
    end
    
    UI <-->|State Updates| CONVEX_CLIENT
    UI <-->|Real-time Events| LIVEBLOCKS_CLIENT
    
    CONVEX_CLIENT <-->|WebSocket| QUERIES
    CONVEX_CLIENT -->|HTTP| MUTATIONS
    QUERIES <--> DB
    MUTATIONS --> DB
    
    LIVEBLOCKS_CLIENT <-->|WebSocket| PRESENCE
    LIVEBLOCKS_CLIENT <-->|WebSocket| ROOMS
    LIVEBLOCKS_CLIENT <-->|WebSocket| CURSORS
    
    DB -.->|Changes Trigger| QUERIES
    QUERIES -.->|Push Updates| CONVEX_CLIENT
    
    style CLIENT fill:#3b82f6,stroke:#1e40af,color:#fff
    style CONVEX fill:#f59e0b,stroke:#d97706,color:#fff
    style LIVEBLOCKS fill:#8b5cf6,stroke:#6d28d9,color:#fff
```

---

## Notification Flow Architecture

```mermaid
graph TB
    subgraph TRIGGERS["🎯 NOTIFICATION TRIGGERS"]
        T1["Task Assigned"]
        T2["Task Completed"]
        T3["Task Overdue"]
        T4["Project Approved"]
        T5["Event Reminder"]
        T6["Achievement Unlocked"]
    end
    
    subgraph SYSTEM["💻 NOTIFICATION SYSTEM"]
        GENERATOR["Notification<br/>Generator"]
        QUEUE["Email Queue"]
        DISPATCHER["Dispatcher"]
    end
    
    subgraph CHANNELS["📢 DELIVERY CHANNELS"]
        INAPP["In-App<br/>Notifications"]
        EMAIL["Email<br/>(Resend)"]
        PUSH["Push Notif<br/>(Firebase FCM)"]
    end
    
    subgraph STORAGE["🗄️ STORAGE"]
        NOTIF_DB[("Notifications<br/>Table")]
        EMAIL_Q[("Email Queue<br/>Table")]
        PUSH_SUB[("Push<br/>Subscriptions")]
    end
    
    T1 --> GENERATOR
    T2 --> GENERATOR
    T3 --> GENERATOR
    T4 --> GENERATOR
    T5 --> GENERATOR
    T6 --> GENERATOR
    
    GENERATOR --> NOTIF_DB
    GENERATOR --> QUEUE
    
    QUEUE --> EMAIL_Q
    
    DISPATCHER --> INAPP
    DISPATCHER --> EMAIL
    DISPATCHER --> PUSH
    
    NOTIF_DB -.->|Read| INAPP
    EMAIL_Q -.->|Process| EMAIL
    PUSH_SUB -.->|Send To| PUSH
    
    INAPP -->|User Sees| USER["👤 User"]
    EMAIL -->|Receives| USER
    PUSH -->|Receives| USER
    
    style TRIGGERS fill:#10b981,stroke:#059669,color:#fff
    style SYSTEM fill:#f59e0b,stroke:#d97706,color:#fff
    style CHANNELS fill:#3b82f6,stroke:#1e40af,color:#fff
    style STORAGE fill:#ec4899,stroke:#be185d,color:#fff
```

---

## Legend

### Node Types
- **Rectangle** - External Entity
- **Rounded Rectangle** - Process
- **Cylinder** - Data Store
- **Diamond** - Decision Point
- **Arrow (→)** - Data Flow Direction
- **Dotted Arrow (-.->)** - Trigger/Event Flow

### Color Coding
- 🔵 **Blue** - Internal Users
- 🟢 **Green** - Public/Residents
- 🟣 **Purple** - External Systems
- 🟠 **Orange** - Core Processes
- 🔴 **Pink** - Data Stores

---

**How to Use These Diagrams:**

1. **Main DFD** - Copy the first Mermaid code to https://mermaid.live/ for full visualization
2. **Context Diagram** - Shows high-level system overview
3. **Sequence Diagrams** - Shows detailed workflows step-by-step
4. **State Diagram** - Shows task status transitions
5. **Architecture Diagrams** - Shows technical implementation

---

**Tools for Visualization:**
- Mermaid Live Editor: https://mermaid.live/
- Draw.io: Can import Mermaid syntax
- VS Code: Install "Markdown Preview Mermaid Support" extension
- Notion/Obsidian: Native Mermaid support

