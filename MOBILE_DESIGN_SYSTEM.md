# 📱 BarangayLink - Mobile Design System

**Date:** Oct 21, 2025  
**Status:** Implementation Guide  
**Goal:** Consistent mobile-first design across all 46+ pages

---

## 🎯 **Design Principles**

### 1. **Mobile-First Approach**
- Design for smallest screen first (320px)
- Progressive enhancement for larger screens
- Touch-friendly targets (minimum 44px)

### 2. **Content Hierarchy**
- Most important content at top
- Progressive disclosure for details
- Collapsible sections to save space

### 3. **Navigation**
- Sidebar hidden by default on mobile
- Hamburger menu (☰) always accessible
- Bottom navigation for key actions

### 4. **Performance**
- Minimal animations on mobile
- Lazy load images and heavy components
- Virtual scrolling for long lists

---

## 📐 **Responsive Breakpoints**

```css
/* Tailwind CSS Breakpoints */
sm:  640px  /* Small tablets */
md:  768px  /* Tablets */
lg:  1024px /* Laptops */
xl:  1280px /* Desktops */
2xl: 1536px /* Large desktops */
```

### Our Strategy:
- **Mobile:** < 640px (base styles)
- **Tablet:** 640px - 767px (sm:)
- **Desktop:** ≥ 768px (md:+)

---

## 🎨 **Component Patterns**

### **1. Page Header Pattern**

```tsx
{/* Mobile-First Header */}
<div className="bg-gray-800 border-b border-gray-700">
  {/* Top Action Bar */}
  <div className="px-3 py-2 flex items-center justify-between">
    {/* Left Actions */}
    <div className="flex items-center gap-2">
      {/* Menu Button - Mobile Only */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        variant="ghost"
        size="sm"
        className="md:hidden p-2"
      >
        <Menu className="w-5 h-5" />
      </Button>
      
      {/* Back Button - Optional */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        size="sm"
        className="p-2"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
    </div>

    {/* Right Actions */}
    <div className="flex items-center gap-2">
      {/* Collapse Toggle */}
      <Button
        onClick={() => setCollapsed(!collapsed)}
        variant="ghost"
        size="sm"
        className="p-2"
      >
        {collapsed ? <ChevronDown /> : <ChevronUp />}
      </Button>
      
      {/* Primary Action */}
      <Button size="sm" className="bg-teal-600">
        <Plus className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Create</span>
      </Button>
    </div>
  </div>

  {/* Page Title - Always Visible */}
  <div className="text-center px-4 py-3 border-t border-gray-700/50">
    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
      Page Title
    </h1>
    {!collapsed && (
      <p className="text-xs sm:text-sm text-gray-400 mt-1">
        Subtitle or description
      </p>
    )}
  </div>

  {/* Collapsible Filters/Stats */}
  {!collapsed && (
    <div className="px-3 py-4 space-y-4 border-t border-gray-700/50">
      {/* Content here */}
    </div>
  )}
</div>
```

### **2. Card Grid Pattern**

```tsx
{/* Responsive Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
  {items.map(item => (
    <Card key={item.id} className="bg-gray-800 hover:bg-gray-700">
      <CardContent className="p-4">
        {/* Card content */}
      </CardContent>
    </Card>
  ))}
</div>
```

### **3. List Pattern**

```tsx
{/* Mobile-Optimized List */}
<div className="space-y-2 p-3">
  {items.map(item => (
    <div 
      key={item.id}
      className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 active:bg-gray-700"
    >
      {/* Icon/Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="w-10 h-10" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-sm truncate">
          {item.title}
        </h3>
        <p className="text-xs text-gray-400 truncate">
          {item.subtitle}
        </p>
      </div>
      
      {/* Action */}
      <Button variant="ghost" size="sm">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  ))}
</div>
```

### **4. Form Pattern**

```tsx
{/* Mobile-Friendly Form */}
<form className="space-y-4 p-4">
  {/* Full Width Inputs */}
  <div className="space-y-2">
    <Label htmlFor="field" className="text-sm">
      Field Label
    </Label>
    <Input
      id="field"
      className="w-full"
      placeholder="Enter value..."
    />
  </div>

  {/* Stacked Buttons on Mobile */}
  <div className="flex flex-col sm:flex-row gap-2">
    <Button
      type="button"
      variant="outline"
      className="w-full sm:w-auto"
    >
      Cancel
    </Button>
    <Button
      type="submit"
      className="w-full sm:w-auto bg-teal-600"
    >
      Submit
    </Button>
  </div>
</form>
```

### **5. Table Pattern**

```tsx
{/* Responsive Table - Card on Mobile */}
<div className="p-4">
  {/* Desktop Table */}
  <div className="hidden md:block">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-800">
          <th className="p-3 text-left">Column 1</th>
          <th className="p-3 text-left">Column 2</th>
          <th className="p-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id} className="border-b border-gray-700">
            <td className="p-3">{item.col1}</td>
            <td className="p-3">{item.col2}</td>
            <td className="p-3">
              <Button size="sm">Edit</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Mobile Cards */}
  <div className="md:hidden space-y-3">
    {items.map(item => (
      <Card key={item.id} className="bg-gray-800">
        <CardContent className="p-4 space-y-2">
          <div>
            <span className="text-xs text-gray-400">Column 1</span>
            <p className="text-white">{item.col1}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Column 2</span>
            <p className="text-white">{item.col2}</p>
          </div>
          <Button size="sm" className="w-full mt-2">
            Edit
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

### **6. Tabs Pattern**

```tsx
{/* Mobile-Friendly Tabs */}
<Tabs defaultValue="tab1" className="w-full">
  {/* Scrollable Tab List */}
  <div className="overflow-x-auto">
    <TabsList className="inline-flex min-w-full sm:w-auto">
      <TabsTrigger value="tab1" className="flex-1 sm:flex-none">
        Tab 1
      </TabsTrigger>
      <TabsTrigger value="tab2" className="flex-1 sm:flex-none">
        Tab 2
      </TabsTrigger>
      <TabsTrigger value="tab3" className="flex-1 sm:flex-none">
        Tab 3
      </TabsTrigger>
    </TabsList>
  </div>
  
  <TabsContent value="tab1" className="p-4">
    {/* Content */}
  </TabsContent>
</Tabs>
```

---

## 🎨 **Spacing System**

```tsx
// Mobile-first padding/margins
className="p-3 sm:p-4 md:p-6"           // Padding
className="m-2 sm:m-3 md:m-4"           // Margin
className="gap-2 sm:gap-3 md:gap-4"     // Grid/Flex gap
className="space-y-2 sm:space-y-3"      // Stack spacing
```

---

## 📏 **Typography Scale**

```tsx
// Headings - Responsive
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
<h2 className="text-lg sm:text-xl md:text-2xl">
<h3 className="text-base sm:text-lg md:text-xl">

// Body Text
<p className="text-sm sm:text-base">        // Normal
<p className="text-xs sm:text-sm">          // Small
<p className="text-xs">                      // Extra small

// Line Clamp
<p className="line-clamp-2">                 // 2 lines max
<p className="truncate">                     // Single line
```

---

## 🔘 **Button Sizes**

```tsx
// Icon-only on mobile, with text on desktop
<Button size="sm" className="w-10 sm:w-auto">
  <Plus className="w-4 h-4" />
  <span className="hidden sm:inline ml-2">Create</span>
</Button>

// Full width on mobile
<Button className="w-full sm:w-auto">
  Submit
</Button>

// Icon buttons
<Button variant="ghost" size="sm" className="p-2">
  <Menu className="w-5 h-5" />
</Button>
```

---

## 📦 **Container Pattern**

```tsx
{/* Responsive Container */}
<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>

{/* Full-width on mobile, contained on desktop */}
<div className="w-full md:max-w-4xl md:mx-auto">
  {/* Content */}
</div>
```

---

## 🎯 **Touch Targets**

```css
/* Minimum 44x44px for touch */
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

/* Buttons */
<Button size="sm" className="h-10 px-4">  /* 40px+ height */
<Button size="default" className="h-11">   /* 44px height */
```

---

## 🎨 **Mobile-Specific Classes**

```tsx
// Show only on mobile
className="md:hidden"

// Hide on mobile
className="hidden md:block"

// Different layouts
className="flex-col md:flex-row"        // Stack on mobile
className="items-start md:items-center" // Align differently
className="text-left md:text-center"    // Text align

// Scrolling
className="overflow-x-auto"             // Horizontal scroll
className="overflow-y-auto max-h-screen" // Vertical scroll
```

---

## 📱 **Mobile Navigation Pattern**

```tsx
{/* Bottom Navigation - Mobile Only */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50">
  <div className="grid grid-cols-5 gap-1 p-2">
    <button className="flex flex-col items-center gap-1 p-2 text-gray-400 active:text-teal-500">
      <Home className="w-5 h-5" />
      <span className="text-xs">Home</span>
    </button>
    <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
      <Calendar className="w-5 h-5" />
      <span className="text-xs">Events</span>
    </button>
    <button className="flex flex-col items-center gap-1 p-2 text-teal-500">
      <Plus className="w-6 h-6" />
    </button>
    <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
      <MessageCircle className="w-5 h-5" />
      <span className="text-xs">Messages</span>
    </button>
    <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
      <User className="w-5 h-5" />
      <span className="text-xs">Profile</span>
    </button>
  </div>
</nav>
```

---

## 🎭 **Loading States**

```tsx
{/* Mobile-Friendly Skeleton */}
<div className="animate-pulse space-y-3 p-4">
  <div className="h-8 bg-gray-700 rounded w-3/4"></div>
  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
  <div className="space-y-2">
    <div className="h-20 bg-gray-700 rounded"></div>
    <div className="h-20 bg-gray-700 rounded"></div>
  </div>
</div>
```

---

## 📋 **Implementation Checklist**

### For Each Page:

- [ ] **Header**: Compact mobile header with menu button
- [ ] **Title**: Large, centered, responsive text
- [ ] **Navigation**: Sidebar hidden on mobile
- [ ] **Content**: Responsive grid/layout
- [ ] **Forms**: Full-width inputs, stacked buttons
- [ ] **Tables**: Card view on mobile
- [ ] **Images**: Responsive sizing
- [ ] **Touch**: 44px minimum tap targets
- [ ] **Spacing**: Mobile-first padding/margins
- [ ] **Typography**: Responsive font sizes
- [ ] **Testing**: Test on 375px, 768px, 1024px

---

## 🎯 **Priority Pages to Update**

### **High Priority (User-Facing):**
1. `/dashboard` - Main dashboard
2. `/events` - Event calendar
3. `/projects` - Project list
4. `/tasks/my-tasks` - Task management
5. `/messages` - Messaging
6. `/profile` - User profile
7. `/notifications` - Notifications

### **Medium Priority:**
8. `/events/sprints` - Sprint board
9. `/tasks/team` - Team tasks
10. `/projects/[id]` - Project details
11. `/documents` - Document library
12. `/admin/users` - User management

### **Low Priority:**
13. Admin pages
14. Settings pages
15. Test/Debug pages

---

## 🚀 **Quick Start Template**

```tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ArrowLeft, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/Sidebar';

export default function MobileFriendlyPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="WORKER"
        dashboardTitle="Page Title"
        dashboardSubtitle="Page description"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile-First Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          {/* Top Bar */}
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </Button>
              <Button size="sm" className="bg-teal-600">
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Create</span>
              </Button>
            </div>
          </div>

          {/* Page Title */}
          <div className="text-center px-4 py-3 border-t border-gray-700/50">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Page Title
            </h1>
            {!headerCollapsed && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Page Description
              </p>
            )}
          </div>

          {/* Collapsible Section */}
          {!headerCollapsed && (
            <div className="px-3 py-4 border-t border-gray-700/50">
              {/* Filters, Stats, etc. */}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* Your content here */}
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 **Testing Checklist**

Test each page at these viewports:

- [ ] **320px** - iPhone SE (smallest)
- [ ] **375px** - iPhone 12/13/14
- [ ] **390px** - iPhone 12/13 Pro Max
- [ ] **414px** - iPhone Plus models
- [ ] **768px** - iPad Portrait
- [ ] **1024px** - iPad Landscape
- [ ] **1280px** - Laptop
- [ ] **1920px** - Desktop

---

**Ready to implement! Start with high-priority pages and apply these patterns consistently.** 📱✨
