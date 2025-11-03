# BARANGAYLINK V2 - DATA FLOW DIAGRAM LEVEL 0
## Proposed Architecture Based on Actual Codebase Analysis

---

## EXTERNAL ENTITIES (Actors)

### Internal Users
1. **BARANGAY OFFICIALS** (Admin/Captain)
   - System administrators
   - Full access to all modules
   - User approval authority
   - Project approval authority

2. **DEPARTMENT MANAGERS**
   - Department-level access
   - Project creation in own department
   - Team management
   - Budget oversight

3. **BUILDERS**
   - Task execution
   - Project participation
   - Can create projects in own department
   - Limited management capabilities

4. **WORKERS**
   - Task execution only
   - View assigned projects/tasks
   - No creation permissions
   - Basic participation

### External Users
5. **RESIDENTS** (Public/Non-authenticated)
   - View public projects
   - RSVP to public events
   - Submit project feedback
   - View community information

### External Systems
6. **CLERK** (Authentication Service)
   - User authentication
   - Session management
   - OAuth handling
   - Webhook events

7. **RESEND** (Email Service)
   - Invitation emails
   - Notification emails
   - OTP verification
   - System alerts

8. **LIVEBLOCKS** (Real-time Collaboration)
   - Real-time project collaboration
   - Live cursors and presence
   - Collaborative editing

9. **FIREBASE** (Push Notifications)
   - Mobile push notifications
   - Web push notifications
   - FCM token management

10. **MAPBOX** (Mapping Service)
    - Location display
    - Project coordinates
    - Event locations
    - Interactive maps

11. **FACEBOOK MESSENGER** (Integration)
    - Message synchronization
    - External communication
    - Notification delivery

---

## CORE PROCESSES

### 1.0 USER MANAGEMENT & AUTHENTICATION
**Sub-processes:**
- 1.1 User Registration
- 1.2 User Login/Logout
- 1.3 User Approval Workflow
- 1.4 Invitation System
- 1.5 Profile Management
- 1.6 Session Tracking
- 1.7 Role Assignment

**Inputs:**
- Registration data from Residents
- Login credentials from All Users
- Approval decisions from Barangay Officials
- Invitation data from Barangay Officials
- Webhook events from Clerk

**Outputs:**
- User account to Users Database
- Session tokens to Users
- Approval notifications to Users
- Invitation emails via Resend
- Activity logs to Audit Database

**Data Stores:**
- Users
- UserLevels
- UserSessions
- OnlinePresence
- UserInvitations
- InvitationCodes
- AuditLogs

---

### 2.0 PROJECT MANAGEMENT
**Sub-processes:**
- 2.1 Project Creation
- 2.2 Project Approval Workflow
- 2.3 Project Assignment
- 2.4 Progress Tracking
- 2.5 Budget Management
- 2.6 Milestone Management
- 2.7 Success Criteria Tracking

**Inputs:**
- Project proposals from Managers/Builders
- Approval decisions from Barangay Officials
- Progress updates from Team Members
- Budget data from Managers
- Milestone data from Project Creators

**Outputs:**
- Project records to Projects Database
- Assignment notifications to Team Members
- Progress reports to Stakeholders
- Budget alerts to Managers
- Public project info to Landing Page
- Activity logs to Project Activities

**Data Stores:**
- Projects
- Milestones
- ProjectActivities
- Expenses
- ProjectFeedback
- ProjectTemplates

---

### 3.0 TASK MANAGEMENT (GAMIFIED)
**Sub-processes:**
- 3.1 Task Creation
- 3.2 Task Assignment
- 3.3 Kanban Board Management
- 3.4 Task Status Updates
- 3.5 Validation Rules Check
- 3.6 Task Completion Verification
- 3.7 Gamification Rewards

**Inputs:**
- Task data from Project Members
- Assignment data from Managers
- Status updates from Workers/Builders
- Drag-drop actions from Kanban Users
- Validation rules from Column Config
- Completion confirmations from Assigned Users

**Outputs:**
- Task records to Tasks Database
- Assignment notifications to Users
- XP/Gold rewards to User Stats
- Progress updates to Projects
- Verification requests to Managers
- Achievement notifications to Users

**Data Stores:**
- Tasks
- KanbanColumns
- UserStats
- GamifiedTasks
- StoryPointGamification

---

### 4.0 EVENT MANAGEMENT
**Sub-processes:**
- 4.1 Event Creation
- 4.2 Event Publishing
- 4.3 Public RSVP Handling
- 4.4 Event Task Management
- 4.5 Attendance Tracking
- 4.6 Document Upload Verification

**Inputs:**
- Event data from Organizers
- RSVP data from Residents/Users
- Public attendee info from Residents
- OTP verification from Residents
- Document uploads from Residents
- Event updates from Organizers

**Outputs:**
- Event records to Events Database
- Event listings to Calendar/Landing Page
- RSVP confirmations via Resend
- Event reminders via Notifications
- Attendance lists to Organizers
- Event tasks to Event Tasks Database

**Data Stores:**
- Events
- EventTasks
- EventTaskAssignments
- EventTaskComments
- EventTaskTimeEntries
- OTPVerifications

---

### 5.0 MILESTONE & SPRINT MANAGEMENT
**Sub-processes:**
- 5.1 Milestone Creation
- 5.2 Sprint Planning
- 5.3 Task Assignment to Milestones
- 5.4 Progress Calculation
- 5.5 Burndown Tracking
- 5.6 Sprint Completion

**Inputs:**
- Milestone data from Project Managers
- Sprint plans from Team Leads
- Task assignments from Managers
- Progress updates from Team Members
- Completion data from Workers

**Outputs:**
- Milestone records to Milestones Database
- Sprint data to Sprints Database
- Progress metrics to Dashboard
- Burndown charts to Sprint Board
- Completion notifications to Teams

**Data Stores:**
- Milestones
- Sprints
- SprintTasks
- BacklogItems
- KanbanColumns (per milestone)

---

### 6.0 DOCUMENT MANAGEMENT
**Sub-processes:**
- 6.1 Document Upload
- 6.2 Document Tagging
- 6.3 Document Categorization
- 6.4 Access Control
- 6.5 Document Search
- 6.6 Version Tracking

**Inputs:**
- Documents from All Users
- Tags and metadata from Uploaders
- Access permissions from Project Managers
- Search queries from Users

**Outputs:**
- Document records to Documents Database
- Storage IDs to Convex Storage
- Document links to Projects/Tasks/Events
- Search results to Users
- Access logs to Audit System

**Data Stores:**
- Documents
- Files
- DocumentTagging

---

### 7.0 MESSAGING & COLLABORATION
**Sub-processes:**
- 7.1 Chat Room Management
- 7.2 Message Sending
- 7.3 Real-time Synchronization
- 7.4 Messenger Integration
- 7.5 Message Reactions
- 7.6 Pinned Messages
- 7.7 Typing Indicators

**Inputs:**
- Messages from Users
- Room creation requests from Users
- Messenger messages from Facebook API
- Reactions from Users
- Typing events from Users
- Presence data from Users

**Outputs:**
- Messages to ChatRooms Database
- Real-time updates via Liveblocks
- Messenger sync via Facebook API
- Notifications to Participants
- Read receipts to Senders
- Presence status to Room Members

**Data Stores:**
- ChatRooms
- Messages
- MessageSyncLog
- FacebookConnections
- OnlinePresence

---

### 8.0 NOTIFICATION SYSTEM
**Sub-processes:**
- 8.1 Notification Generation
- 8.2 In-app Notifications
- 8.3 Email Notifications
- 8.4 Push Notifications
- 8.5 Task Notifications (Due/Overdue)
- 8.6 Achievement Notifications
- 8.7 Daily Digest

**Inputs:**
- System events from All Processes
- Task deadlines from Tasks Database
- Achievement triggers from Gamification
- User preferences from Users
- Cron triggers from System

**Outputs:**
- Notifications to Notifications Database
- Emails via Resend
- Push notifications via Firebase FCM
- In-app alerts to Users
- Daily digest emails to Users
- Deadline reminders to Task Assignees

**Data Stores:**
- Notifications
- EmailQueue
- PushSubscriptions
- NotificationPreferences

---

### 9.0 FINANCIAL TRACKING
**Sub-processes:**
- 9.1 Budget Allocation
- 9.2 Expense Recording
- 9.3 Receipt Management
- 9.4 Expense Approval
- 9.5 Budget Monitoring
- 9.6 Financial Reporting

**Inputs:**
- Budget data from Project Managers
- Expense records from Team Members
- Receipt uploads from Users
- Approval decisions from Managers

**Outputs:**
- Expense records to Expenses Database
- Budget alerts to Managers
- Financial reports to Barangay Officials
- Approval notifications to Submitters
- Receipt storage to Documents

**Data Stores:**
- Expenses
- Financials
- Projects (budget fields)

---

### 10.0 PUBLIC ENGAGEMENT
**Sub-processes:**
- 10.1 Public Project Display
- 10.2 Feedback Collection
- 10.3 OTP Verification
- 10.4 Feedback Moderation
- 10.5 Public Statistics
- 10.6 Event RSVP (Public)

**Inputs:**
- Feedback from Residents
- OTP requests from Residents
- Moderation decisions from Officials
- Public project queries from Landing Page
- RSVP data from Residents

**Outputs:**
- Feedback to ProjectFeedback Database
- OTP emails via Resend
- Public stats to Landing Page
- Moderation results to Feedback Database
- RSVP confirmations via Email
- Public project listings to Landing Page

**Data Stores:**
- ProjectFeedback
- OTPVerifications
- PublicStats
- Events (public events)
- Projects (public projects)

---

### 11.0 ANALYTICS & REPORTING
**Sub-processes:**
- 11.1 Dashboard Analytics
- 11.2 User Activity Tracking
- 11.3 Performance Metrics
- 11.4 Audit Logging
- 11.5 Search Analytics
- 11.6 Team Workload Analysis

**Inputs:**
- User activities from All Processes
- Search queries from Users
- Performance data from System
- Audit events from Critical Operations

**Outputs:**
- Analytics to Analytics Database
- Dashboard metrics to Users
- Activity logs to UserActivityLogs
- Audit trails to AuditLogs
- Performance reports to Admins
- Workload reports to Managers

**Data Stores:**
- Analytics
- UserActivityLogs
- AuditLogs
- SearchHistory
- TeamWorkload
- TeamStats

---

### 12.0 BACKUP & SECURITY
**Sub-processes:**
- 12.1 Automated Backups
- 12.2 Manual Backups
- 12.3 Data Restore
- 12.4 Security Settings
- 12.5 Access Control
- 12.6 Session Management

**Inputs:**
- Backup triggers from Cron/Admin
- Security settings from Admins
- Restore requests from Admins
- Session heartbeats from Users

**Outputs:**
- Backup files to SystemBackups
- Restore data to All Tables
- Security configs to SecuritySettings
- Session records to UserSessions
- Access logs to AuditLogs

**Data Stores:**
- SystemBackups
- Backups
- BackupSchedules
- SecuritySettings
- UserSessions

---

## DATA FLOWS (Summary)

### Primary User Flows

**1. RESIDENT → PUBLIC ENGAGEMENT → LANDING PAGE**
- Resident views public projects
- Resident submits feedback with OTP
- Resident RSVPs to events
- System displays public statistics

**2. USER → AUTHENTICATION → SYSTEM**
- User registers via Clerk
- Clerk webhook triggers user creation
- Admin approves/rejects user
- User receives email notification

**3. MANAGER → PROJECT MANAGEMENT → TEAM**
- Manager creates project
- Admin approves project
- Manager assigns team members
- System sends notifications
- Team views assignments

**4. WORKER → TASK MANAGEMENT → MANAGER**
- Worker views assigned tasks
- Worker updates task status (Kanban)
- System validates column rules
- Manager verifies completion
- System awards XP/Gold

**5. ORGANIZER → EVENT MANAGEMENT → RESIDENTS**
- Organizer creates event
- System publishes to calendar/landing
- Resident RSVPs with OTP
- System sends confirmation
- Organizer views attendees

**6. USER → MESSAGING → TEAM**
- User sends message
- Liveblocks syncs real-time
- System logs to database
- Messenger syncs (if connected)
- Team receives notifications

**7. SYSTEM → NOTIFICATION → USERS**
- Cron checks task deadlines
- System generates notifications
- System sends email (Resend)
- System sends push (Firebase)
- User views in-app notification

---

## EXTERNAL INTEGRATIONS DATA FLOWS

### CLERK (Authentication)
**Inbound:**
- user.created webhook
- user.updated webhook
- user.deleted webhook

**Outbound:**
- Registration redirect
- Login redirect
- Session validation requests

### RESEND (Email)
**Outbound Only:**
- Invitation emails
- OTP verification emails
- Event RSVP confirmations
- Task notifications
- Daily digest emails
- System alerts

### LIVEBLOCKS (Real-time)
**Bidirectional:**
- Presence updates
- Cursor positions
- Collaborative edits
- Typing indicators
- Room state sync

### FIREBASE FCM (Push)
**Outbound Only:**
- Task notifications
- Event reminders
- Achievement alerts
- Message notifications
- System announcements

### MAPBOX (Maps)
**Outbound Only:**
- Map tile requests
- Geocoding requests
- Location data for display

### FACEBOOK MESSENGER
**Bidirectional:**
- Incoming messages (webhook)
- Outgoing messages (API)
- User profile sync
- Message sync logs

---

## DATA STORES

### Core Tables (40+ tables)
1. **Users** - User accounts and profiles
2. **UserLevels** - Role definitions
3. **Departments** - Organizational structure
4. **Projects** - Project records
5. **Milestones** - Project milestones
6. **Tasks** - Task records (gamified)
7. **Events** - Event records
8. **EventTasks** - Event-specific tasks
9. **Documents** - Document metadata
10. **ChatRooms** - Chat rooms
11. **Messages** - Chat messages
12. **Notifications** - All notifications
13. **KanbanColumns** - Custom columns per milestone
14. **Expenses** - Financial records
15. **ProjectFeedback** - Public feedback
16. **UserSessions** - Active sessions
17. **OnlinePresence** - Real-time presence
18. **Analytics** - System analytics
19. **AuditLogs** - Security audit trail
20. **SystemBackups** - Backup records

And 20+ more supporting tables...

---

## KEY WORKFLOWS

### Critical Path: Project Creation to Completion

```
MANAGER → Create Project
    ↓
ADMIN → Approve Project
    ↓
MANAGER → Assign Team + Create Milestones
    ↓
MANAGER → Create Tasks in Milestone Kanban
    ↓
WORKERS → Execute Tasks (Drag through Kanban)
    ↓
SYSTEM → Validate Column Rules
    ↓
MANAGER → Verify Task Completion
    ↓
SYSTEM → Award Gamification Points
    ↓
SYSTEM → Update Project Progress
    ↓
MANAGER → Mark Milestone Complete
    ↓
RESIDENTS → View Progress on Landing Page
    ↓
RESIDENTS → Submit Feedback
    ↓
ADMIN → Moderate Feedback
    ↓
MANAGER → Mark Project Complete
    ↓
SYSTEM → Generate Completion Reports
```

### Critical Path: User Registration to Active Work

```
RESIDENT → Register via Clerk
    ↓
CLERK → Send webhook to System
    ↓
SYSTEM → Create User (status: pending)
    ↓
SYSTEM → Notify User (pending approval)
    ↓
ADMIN → Review User Profile
    ↓
ADMIN → Approve/Reject User
    ↓
SYSTEM → Update User Status
    ↓
RESEND → Send Approval Email
    ↓
USER → Login to Dashboard
    ↓
MANAGER → Assign to Projects/Tasks
    ↓
SYSTEM → Send Assignment Notifications
    ↓
USER → Start Working (Clock In)
    ↓
USER → Complete Tasks (Earn XP/Gold)
    ↓
SYSTEM → Track Activity & Performance
```

---

## AUTOMATED PROCESSES (Cron Jobs)

1. **Task Deadline Monitor** (Hourly at :15)
   - Check due/overdue tasks
   - Send notifications to assignees
   - Update task priority

2. **Role Auto-Fix** (Hourly at :05)
   - Check users without roles
   - Auto-assign based on userLevel
   - Maintain data integrity

3. **Daily Digest** (Daily)
   - Compile user activities
   - Generate summary emails
   - Send via Resend

4. **Session Cleanup** (Periodic)
   - Remove expired sessions
   - Update presence status
   - Clean up stale data

---

## SECURITY & COMPLIANCE

### Access Control Layers
1. **Clerk Authentication** - External auth service
2. **Role-Based Access** - Internal permission system
3. **Department-Based Access** - Organizational boundaries
4. **Status-Based Access** - Approval workflow gates
5. **Session Validation** - Active session tracking

### Audit Trail
- All user actions logged to AuditLogs
- Critical operations logged with severity
- User activity tracked in UserActivityLogs
- Session tracking in UserSessions
- Project activities in ProjectActivities

---

## SYSTEM BOUNDARIES

### Inside System Boundary (Convex + Next.js)
- All business logic
- Database operations
- Real-time collaboration
- User interface
- API endpoints
- Webhook handlers

### Outside System Boundary (External)
- Clerk (Authentication)
- Resend (Email delivery)
- Liveblocks (Real-time infrastructure)
- Firebase (Push notifications)
- Mapbox (Mapping services)
- Facebook (Messenger integration)

---

## PERFORMANCE OPTIMIZATIONS

1. **Database Indexing**
   - All queries have appropriate indexes
   - Composite indexes for complex queries
   - Time-based indexes for analytics

2. **Caching Strategy**
   - Query result caching
   - Static asset caching (PWA)
   - IndexedDB for offline mode

3. **Real-time Updates**
   - Liveblocks for collaboration
   - Convex reactive queries
   - Optimistic updates

4. **Pagination**
   - Large lists paginated
   - Infinite scroll where appropriate
   - Lazy loading for images

---

## FUTURE EXPANSION POINTS

1. **Mobile Apps**
   - PWA already implemented
   - Native apps possible via React Native
   - Full offline support

2. **API Expansion**
   - RESTful API endpoints
   - GraphQL consideration
   - Third-party integrations

3. **Advanced Analytics**
   - ML-based predictions
   - Advanced reporting
   - Data visualization enhancements

4. **Additional Integrations**
   - More social platforms
   - Payment gateways
   - SMS notifications

---

## DIAGRAM LEGEND

```
[EXTERNAL ENTITY] - Rectangle
    ↓ ↑          - Data Flow Direction
(PROCESS)        - Rounded Rectangle / Circle
[DATABASE]       - Open Rectangle (two parallel lines)
---              - System Boundary
```

---

**Document Version:** 1.0
**Date:** November 3, 2024
**Analysis Based On:** Actual BarangayLink V2 Codebase
**Total Processes Identified:** 12 Major + 60+ Sub-processes
**Total Data Stores:** 40+ Tables
**Total External Integrations:** 6 Systems
**Total User Types:** 5 Roles

---

This DFD Level 0 represents the **actual implementation** of BarangayLink V2 based on comprehensive codebase analysis, including:
- 1375 lines of schema definitions
- 55+ Convex backend files
- Complete frontend React/Next.js implementation
- Full integration with 6 external services
- Gamification system (Habitica-inspired)
- Role-based access control
- Public engagement features
- Real-time collaboration
- Comprehensive notification system
