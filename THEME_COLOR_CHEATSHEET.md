# 🎨 Theme Color Cheatsheet
Quick reference for color migration

## 🔄 Common Replacements

### Backgrounds
```
bg-white          → bg-background
bg-gray-50        → bg-surface
bg-gray-100       → bg-surface-hover
bg-gray-700       → bg-elevated
bg-gray-800       → bg-surface
bg-gray-900       → bg-background
```

### Text
```
text-white        → text-text-primary
text-gray-900     → text-text-primary
text-gray-600     → text-text-secondary
text-gray-500     → text-text-secondary
text-gray-400     → text-text-tertiary
text-gray-300     → text-text-tertiary
```

### Borders
```
border-gray-200   → border-border
border-gray-300   → border-border-hover
border-gray-700   → border-border
border-gray-800   → border-divider
```

### Brand Colors
```
bg-emerald-500    → bg-primary
bg-emerald-600    → bg-primary-600
bg-teal-500       → bg-primary
text-emerald-400  → text-primary
text-teal-400     → text-primary

bg-blue-500       → bg-secondary
text-blue-400     → text-secondary

bg-orange-500     → bg-accent
text-orange-400   → text-accent
```

### Semantic
```
bg-green-500      → bg-success
bg-red-500        → bg-error
bg-yellow-500     → bg-warning
text-green-400    → text-success
text-red-400      → text-error
```

---

## 📋 Copy-Paste Color Palette

### For VSCode Find & Replace

**Find (regex enabled):**
```regex
bg-gray-900(?!/)
```

**Replace with:**
```
bg-background
```

Repeat for each color in the mapping table above.

---

## 🎯 Most Common Patterns

### Sidebar/Navigation
```tsx
// Before
className="bg-gray-900 text-white border-gray-700"

// After
className="bg-background text-text-primary border-border"
```

### Cards
```tsx
// Before
className="bg-white border-gray-200 shadow-lg"

// After  
className="bg-elevated border-border shadow-lg"
```

### Buttons (Primary)
```tsx
// Before
className="bg-emerald-600 hover:bg-emerald-700 text-white"

// After
className="bg-primary hover:bg-primary-600 text-text-inverse"
```

### Buttons (Secondary)
```tsx
// Before
className="bg-gray-100 hover:bg-gray-200 text-gray-900"

// After
className="bg-surface hover:bg-surface-hover text-text-primary"
```

### Input Fields
```tsx
// Before
className="bg-white border-gray-300 text-gray-900 focus:border-emerald-500"

// After
className="bg-background border-border text-text-primary focus:border-primary"
```

### Modals/Dialogs
```tsx
// Before
className="bg-white border-gray-200 shadow-2xl"

// After
className="bg-elevated border-border shadow-2xl"
```

---

## ⚠️ Special Cases

### With Opacity
```tsx
// Before
className="bg-gray-900/50"

// After
className="bg-background/50"
```

### Gradients
```tsx
// Before
className="bg-gradient-to-r from-emerald-600 to-emerald-700"

// After
className="bg-gradient-to-r from-primary-600 to-primary-700"
```

### Shadows with Color
```tsx
// Before
className="shadow-emerald-500/30"

// After
className="shadow-primary/30"
```

### Hover States
```tsx
// Before
className="hover:bg-gray-800 hover:text-teal-400"

// After
className="hover:bg-surface-hover hover:text-primary"
```

---

## 🚫 Don't Replace These

Keep as-is (they're fine):
- `ring-*` (focus rings)
- Status indicators (if using specific colors intentionally)
- Charts/graphs (if data-driven colors)
- Avatar placeholders
- File type indicators

---

## 💾 Save This Snippet

```tsx
// Theme-aware component template
export function MyComponent() {
  return (
    <div className="bg-surface border-border">
      <h1 className="text-text-primary">Title</h1>
      <p className="text-text-secondary">Description</p>
      <button className="bg-primary hover:bg-primary-600 text-text-inverse">
        Action
      </button>
    </div>
  );
}
```
