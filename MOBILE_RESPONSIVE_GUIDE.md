# Mobile Responsive Design Guide for BarangayLink V2

## ✅ Completed Pages
- `/admin/users` - Full mobile card view with responsive stats
- `/tasks/team` - Mobile header and sidebar integration  
- `/events` - Mobile-friendly calendar and event cards
- `EventsCalendarWidget` - Touch-optimized calendar with mobile layouts

## 🎯 Mobile-First CSS Patterns

### Responsive Text Sizes
```tsx
// Headers
className="text-2xl sm:text-3xl lg:text-4xl"

// Body text
className="text-sm sm:text-base"

// Small text
className="text-xs sm:text-sm"
```

### Responsive Spacing
```tsx
// Padding
className="p-3 sm:p-4 lg:p-6"

// Gaps
className="gap-2 sm:gap-4 lg:gap-6"

// Margins
className="mb-3 sm:mb-4 lg:mb-6"
```

### Responsive Grids
```tsx
// 2-column mobile, 4-column desktop
className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"

// 1-column mobile, 3-column desktop
className="grid grid-cols-1 md:grid-cols-3 gap-4"

// Auto-fit responsive
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
```

### Responsive Flex
```tsx
// Stack on mobile, row on desktop
className="flex flex-col sm:flex-row gap-3 sm:gap-4"

// Full width on mobile, auto on desktop
className="w-full sm:w-auto"
```

### Hide/Show Elements
```tsx
// Hide on mobile, show on desktop
className="hidden sm:inline"
className="hidden md:block"

// Show on mobile only
className="sm:hidden"
className="md:hidden"
```

### Touch-Friendly Buttons
```tsx
// Minimum 44x44px touch targets
className="px-4 py-3 sm:px-6 sm:py-3 touch-manipulation"

// Larger icons on mobile
<Icon className="w-5 h-5 sm:w-4 sm:h-4" />
```

### Table to Card Pattern (Desktop/Mobile)
```tsx
{/* Desktop Table */}
<div className="hidden md:block">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>

{/* Mobile Cards */}
<div className="md:hidden space-y-3">
  {items.map(item => (
    <div key={item.id} className="bg-white/5 rounded-xl border p-4">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Responsive Input Fields
```tsx
className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base"
```

### Mobile Header Pattern
```tsx
{/* Mobile Header with Hamburger */}
<div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
  <button onClick={() => setSidebarOpen(true)}>
    <Menu className="w-5 h-5" />
  </button>
  <h1 className="text-lg font-semibold">Page Title</h1>
  <div className="w-9" />
</div>
```

## 🔧 Common Patterns to Apply

### Stats Cards
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
  <div className="bg-white/10 rounded-lg p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-gray-400">Label</p>
    <p className="text-xl sm:text-2xl font-bold text-white">Value</p>
  </div>
</div>
```

### Search and Filters
```tsx
<div className="flex flex-col gap-3">
  {/* Search bar - full width */}
  <input className="w-full px-3 py-2.5 text-sm" />
  
  {/* Filters - 2 columns on mobile */}
  <div className="grid grid-cols-2 gap-3">
    <select className="px-3 py-2.5 text-sm" />
    <select className="px-3 py-2.5 text-sm" />
  </div>
</div>
```

### Action Buttons
```tsx
<div className="flex gap-2 w-full sm:w-auto">
  <Button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm">
    <Icon className="w-4 h-4 sm:mr-2" />
    <span className="hidden sm:inline">Full Text</span>
    <span className="sm:hidden">Short</span>
  </Button>
</div>
```

## 📱 Mobile-Specific Considerations

1. **Touch Targets**: Minimum 44x44px for all interactive elements
2. **Font Sizes**: Base size 14px (text-sm) on mobile, 16px (text-base) on desktop
3. **Spacing**: Use compact spacing (3-4 units) on mobile, standard (6-8 units) on desktop
4. **Icons**: Slightly larger on mobile for better visibility
5. **Tables**: Always provide card alternative for mobile
6. **Modals**: Full-screen or near full-screen on mobile
7. **Forms**: Stack all form fields vertically on mobile
8. **Navigation**: Hamburger menu for mobile, expanded sidebar for desktop

## 🚀 Quick Apply Checklist

For each page, ensure:
- [ ] Mobile header with hamburger menu
- [ ] Responsive text sizes (sm:text-*)
- [ ] Responsive padding/gaps (sm:p-*, sm:gap-*)
- [ ] Responsive grids (grid-cols-1 sm:grid-cols-*)
- [ ] Tables have mobile card alternatives
- [ ] Buttons have proper touch targets
- [ ] Hide unnecessary elements on mobile
- [ ] Test on 375px width (iPhone SE) and 768px (tablet)

## 🎨 Breakpoint Reference
- `sm:` - 640px and up (mobile landscape, small tablets)
- `md:` - 768px and up (tablets)
- `lg:` - 1024px and up (desktops)
- `xl:` - 1280px and up (large desktops)
- `2xl:` - 1536px and up (extra large screens)

## ⚡ Performance Tips
1. Use `touch-manipulation` CSS for better touch responsiveness
2. Avoid hover effects on mobile (use active states instead)
3. Optimize images for mobile viewports
4. Lazy load off-screen content
5. Use CSS transitions sparingly on mobile

