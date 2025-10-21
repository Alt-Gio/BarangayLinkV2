# 📱 MobilePage Component - Usage Examples

**Created:** Oct 21, 2025  
**Component:** `src/components/layout/MobilePage.tsx`

---

## 🎯 **Quick Start**

### **1. Basic Usage (Simplest)**

```tsx
import { MobilePageSimple } from '@/components/layout/MobilePage';

export default function SimplePage() {
  return (
    <MobilePageSimple
      title="My Page"
      subtitle="Page description"
    >
      <div className="space-y-4">
        <p>Your content here</p>
      </div>
    </MobilePageSimple>
  );
}
```

---

### **2. With Header Actions**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageWithActions() {
  return (
    <MobilePage
      title="Projects"
      subtitle="Manage your projects"
      headerActions={
        <>
          <Button
            size="sm"
            variant="ghost"
            className="p-2 hidden sm:flex"
          >
            <Download className="w-5 h-5" />
          </Button>
          
          <Button size="sm" className="bg-teal-600">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">New Project</span>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Project cards */}
      </div>
    </MobilePage>
  );
}
```

---

### **3. With Collapsible Stats & Filters**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function PageWithCollapsible() {
  return (
    <MobilePage
      title="Events"
      subtitle="Browse upcoming events"
      headerActions={
        <Button size="sm" className="bg-teal-600">
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Create</span>
        </Button>
      }
      collapsibleHeader={
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3 bg-gray-700">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">24</p>
            </Card>
            <Card className="p-3 bg-gray-700">
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-400">12</p>
            </Card>
            <Card className="p-3 bg-gray-700">
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-blue-400">10</p>
            </Card>
            <Card className="p-3 bg-gray-700">
              <p className="text-xs text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-yellow-400">2</p>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              className="pl-10 bg-gray-700 border-gray-600"
            />
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Event list */}
      </div>
    </MobilePage>
  );
}
```

---

### **4. With User Role**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';
import { useOfflineData } from '@/contexts/OfflineDataContext';

export default function PageWithRole() {
  const { currentUser } = useOfflineData();

  return (
    <MobilePage
      title="Admin Panel"
      subtitle="System administration"
      userRole={currentUser?.userLevel?.name || "WORKER"}
    >
      <div className="p-4">
        {/* Admin content */}
      </div>
    </MobilePage>
  );
}
```

---

### **5. With Custom Back Action**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';
import { useRouter } from 'next/navigation';

export default function PageWithCustomBack() {
  const router = useRouter();

  return (
    <MobilePage
      title="Project Details"
      subtitle="View project information"
      showBack={true}
      onBack={() => router.push('/projects')}
    >
      <div className="p-4">
        {/* Project details */}
      </div>
    </MobilePage>
  );
}
```

---

### **6. Without Back Button**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';

export default function PageNoBack() {
  return (
    <MobilePage
      title="Dashboard"
      subtitle="Your overview"
      showBack={false}
    >
      <div className="p-4">
        {/* Dashboard content */}
      </div>
    </MobilePage>
  );
}
```

---

### **7. Start Collapsed**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';

export default function PageCollapsed() {
  return (
    <MobilePage
      title="Tasks"
      subtitle="Your task list"
      defaultCollapsed={true}
      collapsibleHeader={
        <div>
          {/* Stats and filters */}
        </div>
      }
    >
      <div className="p-4">
        {/* Tasks list */}
      </div>
    </MobilePage>
  );
}
```

---

### **8. Custom Padding**

```tsx
import { MobilePage } from '@/components/layout/MobilePage';

export default function PageCustomPadding() {
  return (
    <MobilePage
      title="Messages"
      subtitle="Your conversations"
      contentPadding="p-0" // No padding for full-width chat
    >
      <div className="flex flex-col h-full">
        {/* Full-width chat interface */}
      </div>
    </MobilePage>
  );
}
```

---

## 🎨 **Real-World Examples**

### **Example 1: Projects List Page**

```tsx
// src/app/projects/page.tsx
"use client";

import { MobilePage } from '@/components/layout/MobilePage';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function ProjectsPage() {
  const { currentUser } = useOfflineData();
  const projects = useQuery(api.projects.getAll);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = {
    total: projects?.length || 0,
    active: projects?.filter(p => p.status === 'active').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
  };

  return (
    <MobilePage
      title="Projects"
      subtitle="Browse and manage projects"
      userRole={currentUser?.userLevel?.name || "WORKER"}
      showBack={false}
      headerActions={
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => {/* Create project */}}
        >
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">New Project</span>
        </Button>
      }
      collapsibleHeader={
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="bg-gray-700/50">
              <CardContent className="p-3">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {stats.total}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-700/50">
              <CardContent className="p-3">
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {stats.active}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-700/50">
              <CardContent className="p-3">
                <p className="text-xs text-gray-400">Done</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">
                  {stats.completed}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button variant="outline" size="sm" className="px-3">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      }
    >
      {/* Project Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects
          ?.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(project => (
            <Card
              key={project._id}
              className="bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {project.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {project.progress}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </MobilePage>
  );
}
```

---

### **Example 2: My Tasks Page**

```tsx
// src/app/tasks/my-tasks/page.tsx
"use client";

import { MobilePage } from '@/components/layout/MobilePage';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function MyTasksPage() {
  const { currentUser } = useOfflineData();
  const tasks = []; // Get from Convex

  return (
    <MobilePage
      title="My Tasks"
      subtitle="Your assigned tasks"
      userRole={currentUser?.userLevel?.name || "WORKER"}
      showBack={false}
    >
      {/* Task List */}
      <div className="space-y-2">
        {tasks.map(task => (
          <Card
            key={task.id}
            className="bg-gray-800 hover:bg-gray-700 p-4"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <Checkbox
                checked={task.completed}
                className="mt-1"
              />

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  {task.description}
                </p>
                
                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {task.priority}
                  </Badge>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {task.dueDate}
                  </span>
                </div>
              </div>

              {/* Status Icon */}
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </MobilePage>
  );
}
```

---

## 📋 **Props Reference**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page title (centered, prominent) |
| `subtitle` | `string` | `undefined` | Optional subtitle below title |
| `userRole` | `string` | `"WORKER"` | User role for sidebar permissions |
| `showBack` | `boolean` | `true` | Show back button in header |
| `onBack` | `() => void` | `router.back()` | Custom back action |
| `headerActions` | `ReactNode` | `undefined` | Buttons in top-right corner |
| `collapsibleHeader` | `ReactNode` | `undefined` | Collapsible content (stats, filters) |
| `children` | `ReactNode` | required | Main page content |
| `defaultCollapsed` | `boolean` | `false` | Start with header collapsed |
| `contentPadding` | `string` | `"p-3 sm:p-4 md:p-6"` | Custom padding for content |
| `className` | `string` | `""` | Additional classes for container |
| `hideCollapseButton` | `boolean` | `false` | Hide collapse toggle button |
| `showToaster` | `boolean` | `true` | Show toast notifications |
| `dashboardTitle` | `string` | `title` | Custom sidebar dashboard title |
| `dashboardSubtitle` | `string` | `subtitle` | Custom sidebar dashboard subtitle |

---

## 🎯 **Best Practices**

### ✅ **DO:**
- Use `MobilePageSimple` for simple pages
- Use `MobilePage` for pages with filters/stats
- Keep header actions minimal (1-2 buttons)
- Use icon-only buttons on mobile
- Make touch targets 44px minimum
- Test on real mobile devices

### ❌ **DON'T:**
- Don't put too much in `collapsibleHeader`
- Don't use tiny fonts (<12px)
- Don't forget to handle loading states
- Don't make buttons too small
- Don't use horizontal scrolling (except Kanban)

---

## 🚀 **Migration Checklist**

For each page you convert:

- [ ] Import `MobilePage` or `MobilePageSimple`
- [ ] Wrap content with component
- [ ] Move page title to `title` prop
- [ ] Move subtitle to `subtitle` prop
- [ ] Move action buttons to `headerActions`
- [ ] Move stats/filters to `collapsibleHeader`
- [ ] Add `userRole` from `currentUser`
- [ ] Test on mobile (375px width)
- [ ] Test collapse/expand
- [ ] Test sidebar open/close
- [ ] Verify touch targets (44px+)

---

**You now have everything you need to make all your pages mobile-friendly! Start with the examples above and apply to your pages.** 📱✨
