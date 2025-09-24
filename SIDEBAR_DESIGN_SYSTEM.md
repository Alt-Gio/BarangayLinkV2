# BarangayLink v2 - Sidebar Design System

## 🎨 Design Overview

The BarangayLink v2 dashboard features a **role-based sidebar navigation system** that adapts to user permissions and provides a consistent, intuitive interface across all dashboard views.

## 🏗️ Architecture

### Core Components

1. **`Sidebar.tsx`** - Main navigation component
2. **`DashboardLayout.tsx`** - Layout wrapper with role-specific variants
3. **Role-specific layouts** - WorkerDashboardLayout, BuilderDashboardLayout, etc.

### File Structure
```
src/components/layout/
├── Sidebar.tsx                 # Main sidebar component
├── DashboardLayout.tsx         # Layout wrapper
└── ...

src/components/dashboard/
├── WorkerDashboard.tsx         # Now uses WorkerDashboardLayout
├── BuilderDashboard.tsx        # Now uses BuilderDashboardLayout
├── ManagerDashboard.tsx        # Now uses ManagerDashboardLayout
└── AdminDashboard.tsx          # Now uses AdminDashboardLayout
```

## 🎯 Design Principles

### 1. **Role-Based Navigation**
- **Dynamic menu items** based on user permissions
- **Progressive disclosure** - higher roles see more options
- **Hierarchical structure** - WORKER → BUILDER → MANAGER → ADMIN

### 2. **Visual Hierarchy**
- **Dark sidebar** (`bg-gray-900`) with high contrast
- **Green accent color** (`bg-green-600`) for active states
- **Role-based icons** and color coding
- **Collapsible sections** with chevron indicators

### 3. **User Experience**
- **Consistent branding** - BarangayLink logo and version
- **User profile integration** - avatar, name, and role display
- **Quick actions** - Profile and Logout buttons
- **Responsive design** - works on all screen sizes

## 🔐 Role-Based Menu Structure

### WORKER (Level 1)
```
📊 Dashboard Overview
   └── Main Dashboard

📋 Task Management
   └── My Tasks

📅 Event Management
   └── Event Calendar

📄 Document System
   └── Document Library
```

### BUILDER (Level 2) - Inherits WORKER +
```
📁 Project Management
   ├── All Projects
   └── Create Project

📋 Task Management
   ├── My Tasks
   ├── Team Tasks
   └── Create Task

📄 Document System
   ├── Document Library
   └── Upload Documents
```

### MANAGER (Level 3) - Inherits BUILDER +
```
📊 Dashboard Overview
   ├── Main Dashboard
   └── Analytics

📅 Event Management
   ├── Event Calendar
   └── Create Event

📄 Document System
   ├── Document Library
   ├── Official Records
   └── Upload Documents

💰 Financial System
   └── Budget Overview

👥 Registration Management
```

### ADMIN (Level 4) - Inherits MANAGER +
```
📁 Project Management
   ├── All Projects
   ├── Create Project
   └── Project Approval

🛡️ System Administrator
   ├── User Management
   ├── System Settings
   └── Maintenance
```

## 🎨 Visual Design Elements

### Color Scheme
- **Background**: `bg-gray-900` (Dark sidebar)
- **Text**: `text-white` (Primary text)
- **Secondary Text**: `text-gray-300`, `text-gray-400`
- **Active State**: `bg-green-600` (Green accent)
- **Hover State**: `hover:bg-gray-800`
- **Borders**: `border-gray-700`

### Role Colors
- **ADMIN**: `text-red-400` (Crown icon)
- **MANAGER**: `text-blue-400` (Briefcase icon)
- **BUILDER**: `text-green-400` (Hammer icon)
- **WORKER**: `text-gray-400` (User icon)

### Typography
- **Brand Title**: `text-lg font-semibold`
- **Version**: `text-xs text-green-400`
- **Menu Items**: `text-sm font-medium`
- **User Name**: `text-sm font-medium`
- **User Role**: `text-xs` with role color

## 🔧 Implementation Details

### Basic Usage
```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function MyPage() {
  return (
    <DashboardLayout title="Page Title" subtitle="Page description">
      {/* Your content */}
    </DashboardLayout>
  );
}
```

### Role-Specific Layouts
```tsx
import { WorkerDashboardLayout } from '@/components/layout/DashboardLayout';

function WorkerDashboard() {
  return (
    <WorkerDashboardLayout>
      <div className="p-6">
        {/* Worker-specific content */}
      </div>
    </WorkerDashboardLayout>
  );
}
```

### Custom Sidebar Usage
```tsx
import { Sidebar } from '@/components/layout/Sidebar';

function CustomLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar userRole="MANAGER" />
      <main className="flex-1">
        {/* Your content */}
      </main>
    </div>
  );
}
```

## 📱 Responsive Behavior

### Desktop (≥1024px)
- **Full sidebar** always visible
- **Width**: `w-64` (256px)
- **All menu items** expanded by default

### Tablet (768px - 1023px)
- **Collapsible sidebar** with toggle button
- **Overlay mode** when expanded
- **Compact icons** when collapsed

### Mobile (≤767px)
- **Hidden by default** with hamburger menu
- **Full-screen overlay** when opened
- **Touch-optimized** interactions

## 🎯 Customization Options

### Theme Customization
```tsx
// Custom colors in tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'barangay-green': '#10b981',
        'barangay-blue': '#3b82f6',
        'sidebar-dark': '#111827',
      }
    }
  }
}
```

### Menu Item Customization
```tsx
// Add custom menu items in Sidebar.tsx
const customMenuItem = {
  id: 'custom-feature',
  label: 'Custom Feature',
  icon: <CustomIcon className="w-4 h-4" />,
  path: '/custom',
  roles: ['ADMIN'] // Restrict to specific roles
};
```

## 🔍 Testing & Preview

### Preview Page
Visit `/dashboard-preview` to see all role variations:
- **Interactive role selector**
- **Live sidebar preview**
- **Feature comparison**
- **Design documentation**

### Test Different Roles
1. **Worker**: Basic community member view
2. **Builder**: Project coordination features
3. **Manager**: Department oversight tools
4. **Admin**: Full system administration

## 🚀 Integration Steps

### 1. Update Existing Dashboards
```tsx
// Before
export function MyDashboard() {
  return (
    <div className="dashboard-content">
      {/* content */}
    </div>
  );
}

// After
export function MyDashboard() {
  return (
    <DashboardLayout title="My Dashboard">
      <div className="p-6">
        {/* content */}
      </div>
    </DashboardLayout>
  );
}
```

### 2. Add Role-Based Navigation
The sidebar automatically adapts based on the user's role from Convex database.

### 3. Style Consistency
All dashboards now follow the same design patterns:
- **Consistent spacing**: `p-6` for main content
- **Card layouts**: Using `Card` components
- **Color scheme**: Following the design system
- **Typography**: Consistent heading and text styles

## 📋 Checklist

### ✅ Completed
- [x] Core sidebar component with role-based navigation
- [x] Layout wrapper components
- [x] Integration with all dashboard components
- [x] Role-based menu visibility
- [x] User profile integration
- [x] Responsive design foundation
- [x] Preview and documentation page

### 🔄 In Progress
- [ ] Mobile responsive optimizations
- [ ] Keyboard navigation support
- [ ] Animation transitions
- [ ] Theme customization options

### 📋 Future Enhancements
- [ ] Sidebar collapse/expand functionality
- [ ] Custom menu item configuration
- [ ] Advanced role permissions
- [ ] Multi-language support
- [ ] Dark/light theme toggle

## 🎉 Result

The new sidebar design system provides:
- **Consistent user experience** across all dashboards
- **Role-appropriate navigation** for each user type
- **Professional appearance** matching modern dashboard standards
- **Scalable architecture** for future enhancements
- **Accessibility compliance** with proper ARIA labels

The design successfully replicates the requested dashboard look with the dark sidebar, role-based navigation, and clean modern interface while adding personality and functionality specific to each user role.
