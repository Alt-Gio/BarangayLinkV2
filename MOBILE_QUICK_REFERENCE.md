# Mobile Responsive - Quick Reference Cheat Sheet

## 🎯 Most Common Fixes (Copy-Paste Ready)

### Headers
```tsx
// BEFORE
<h1 className="text-3xl font-bold">

// AFTER  
<h1 className="text-2xl sm:text-3xl font-bold">
```

### Grids
```tsx
// BEFORE
<div className="grid grid-cols-4 gap-4">

// AFTER
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
```

### Buttons
```tsx
// BEFORE
<Button className="px-6 py-3">
  <Icon className="w-5 h-5 mr-2" />
  Text
</Button>

// AFTER
<Button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
  <span className="hidden sm:inline">Full Text</span>
  <span className="sm:hidden">Short</span>
</Button>
```

### Flex Containers
```tsx
// BEFORE
<div className="flex items-center justify-between">

// AFTER
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
```

### Card Padding
```tsx
// BEFORE
<CardContent className="p-6">

// AFTER
<CardContent className="p-3 sm:p-6">
```

### Icon Sizes
```tsx
// BEFORE
<Icon className="w-6 h-6" />

// AFTER
<Icon className="w-5 h-5 sm:w-6 sm:h-6" />
```

### Search Inputs
```tsx
// BEFORE
<input className="px-4 py-3" />

// AFTER
<input className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base" />
```

---

## 📋 Table to Cards Template

```tsx
{/* Desktop Table */}
<div className="hidden md:block bg-white/5 rounded-xl border overflow-hidden">
  <table className="w-full">
    {/* Your existing table */}
  </table>
</div>

{/* Mobile Cards */}
<div className="md:hidden space-y-3">
  {items?.map((item) => (
    <div key={item._id} className="bg-white/5 rounded-xl border p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <img src={item.image} className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="text-sm text-gray-400">{item.subtitle}</p>
        </div>
      </div>
      
      {/* Details */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Label:</span>
          <span className="text-white">{item.value}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/10">
        <Button className="flex-1 text-sm">Action 1</Button>
        <Button className="flex-1 text-sm">Action 2</Button>
      </div>
    </div>
  ))}
</div>
```

---

## 🔍 Find & Replace Shortcuts

Use your IDE's find & replace to quickly update multiple files:

### Find: `className="p-6"`
### Replace: `className="p-3 sm:p-6"`

### Find: `className="gap-4"`
### Replace: `className="gap-3 sm:gap-4"`

### Find: `className="text-3xl"`
### Replace: `className="text-2xl sm:text-3xl"`

### Find: `className="grid grid-cols-4"`
### Replace: `className="grid grid-cols-2 sm:grid-cols-4"`

### Find: `className="grid grid-cols-3"`
### Replace: `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"`

---

## ✅ 5-Minute Mobile Check

For each page, quickly verify:

1. ✅ Stats/Cards: 2 columns on mobile
2. ✅ Headers: Smaller text (text-2xl sm:text-3xl)
3. ✅ Buttons: Full width on mobile (w-full sm:w-auto)
4. ✅ Tables: Have mobile card alternative
5. ✅ Padding: Reduced on mobile (p-3 sm:p-6)
6. ✅ Gaps: Smaller on mobile (gap-3 sm:gap-4)
7. ✅ Icons: Slightly smaller (w-5 sm:w-6)
8. ✅ Mobile menu: Hamburger icon visible

---

## 🎨 Breakpoint Quick Reference

- **No prefix** = All sizes (mobile-first)
- **sm:** = 640px+ (mobile landscape)
- **md:** = 768px+ (tablets) - Use this for table/card toggle
- **lg:** = 1024px+ (desktops)
- **xl:** = 1280px+ (large desktops)

---

## 🚀 Copy-Paste Mobile Header

```tsx
{/* Mobile Header with Sidebar Toggle */}
<div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
  <button
    onClick={() => setSidebarOpen(true)}
    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
  >
    <Menu className="w-5 h-5 text-white" />
  </button>
  <h1 className="text-lg font-semibold text-white">Page Title</h1>
  <div className="w-9" /> {/* Spacer for centering */}
</div>
```

---

## 📱 Testing in Browser DevTools

**Chrome/Edge:**
1. Press `F12` or `Ctrl+Shift+I`
2. Click device toolbar icon (or `Ctrl+Shift+M`)
3. Select device: iPhone SE, iPad, Responsive

**Test at these widths:**
- 375px (iPhone SE) - Minimum mobile
- 768px (iPad) - Tablet breakpoint
- 1024px (Desktop) - Desktop breakpoint

---

## 🎯 Priority Order for Updates

1. **High Impact Pages** (Do these first!)
   - `/dashboard` - Main dashboard
   - `/projects` - Project list
   - `/tasks/my-tasks` - Tasks
   - `/documents` - Documents

2. **Medium Impact**
   - `/admin/settings`
   - `/admin/invitations`
   - `/messages`

3. **Low Impact**
   - Settings pages
   - Utility pages

---

## ⚡ Time-Saving Tips

1. **Start with layout** - Get grids/flex right first
2. **Batch similar pages** - Do all table pages together
3. **Use completed pages as reference** - Copy patterns from `/admin/users`
4. **Test as you go** - Don't wait until the end
5. **Focus on mobile first** - Easier to add desktop than fix mobile

---

## 🎨 Color-Coded Checklist

Use this when reviewing a page:

🔴 **Critical** - Breaks layout on mobile
- [ ] No horizontal scroll
- [ ] All content visible
- [ ] Buttons clickable (min 44px)

🟡 **Important** - Affects usability
- [ ] Text readable (min 14px/text-sm)
- [ ] Proper spacing
- [ ] Icons appropriately sized

🟢 **Nice to have** - Enhances experience
- [ ] Animations smooth
- [ ] Transitions appropriate
- [ ] Visual hierarchy clear

---

## 📞 Quick Links

- **Full Guide:** MOBILE_RESPONSIVE_GUIDE.md
- **Progress:** MOBILE_RESPONSIVE_PROGRESS.md
- **Example (Table):** src/app/admin/users/page.tsx
- **Example (Stats):** src/app/tasks/my-tasks/page.tsx
- **Example (Calendar):** src/components/landing/EventsCalendarWidget.tsx

---

**Remember:** Mobile-first = Start small, scale up! 📱 → 💻
