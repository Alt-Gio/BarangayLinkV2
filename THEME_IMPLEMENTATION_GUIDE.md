# 🎨 Light/Dark Mode Implementation Guide
## BarangayLink v2 - Theme System with CSS Variables

**Strategy:** Option 1 - CSS Variables + next-themes  
**Estimated Time:** 15-20 hours  
**Difficulty:** Moderate

---

## 📋 Table of Contents
1. [Phase 1: Setup & Configuration](#phase-1-setup--configuration)
2. [Phase 2: Color System Design](#phase-2-color-system-design)
3. [Phase 3: Component Migration](#phase-3-component-migration)
4. [Phase 4: Testing & Refinement](#phase-4-testing--refinement)
5. [Troubleshooting](#troubleshooting)

---

## Phase 1: Setup & Configuration

### Step 1.1: Install Dependencies

```bash
npm install next-themes
```

### Step 1.2: Create Color System in globals.css

**Location:** `src/app/globals.css`

Add this at the top of your file (after Tailwind imports):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ==================== LIGHT MODE ==================== */
    
    /* Primary Colors - Emerald/Teal (Government Trust) */
    --color-primary-50: 236 253 245;
    --color-primary-100: 209 250 229;
    --color-primary-200: 167 243 208;
    --color-primary-300: 110 231 183;
    --color-primary-400: 52 211 153;
    --color-primary-500: 16 185 129;   /* Main primary */
    --color-primary-600: 5 150 105;
    --color-primary-700: 4 120 87;
    --color-primary-800: 6 95 70;
    --color-primary-900: 6 78 59;
    
    /* Secondary Colors - Blue (Professional) */
    --color-secondary-50: 239 246 255;
    --color-secondary-100: 219 234 254;
    --color-secondary-200: 191 219 254;
    --color-secondary-300: 147 197 253;
    --color-secondary-400: 96 165 250;
    --color-secondary-500: 59 130 246;  /* Main secondary */
    --color-secondary-600: 37 99 235;
    --color-secondary-700: 29 78 216;
    --color-secondary-800: 30 64 175;
    --color-secondary-900: 30 58 138;
    
    /* Accent Colors - Orange (Community Energy) */
    --color-accent-50: 255 247 237;
    --color-accent-100: 255 237 213;
    --color-accent-200: 254 215 170;
    --color-accent-300: 253 186 116;
    --color-accent-400: 251 146 60;
    --color-accent-500: 249 115 22;    /* Main accent */
    --color-accent-600: 234 88 12;
    --color-accent-700: 194 65 12;
    --color-accent-800: 154 52 18;
    --color-accent-900: 124 45 18;
    
    /* Semantic Colors */
    --color-success: 34 197 94;        /* Green */
    --color-warning: 234 179 8;        /* Yellow */
    --color-error: 239 68 68;          /* Red */
    --color-info: 59 130 246;          /* Blue */
    
    /* Background Colors */
    --color-background: 255 255 255;   /* Pure white */
    --color-surface: 249 250 251;      /* Gray-50 */
    --color-surface-hover: 243 244 246; /* Gray-100 */
    --color-elevated: 255 255 255;     /* White (cards, modals) */
    
    /* Text Colors */
    --color-text-primary: 17 24 39;    /* Gray-900 */
    --color-text-secondary: 75 85 99;  /* Gray-600 */
    --color-text-tertiary: 156 163 175; /* Gray-400 */
    --color-text-inverse: 255 255 255; /* White */
    
    /* Border Colors */
    --color-border: 229 231 235;       /* Gray-200 */
    --color-border-hover: 209 213 219; /* Gray-300 */
    --color-divider: 243 244 246;      /* Gray-100 */
    
    /* Shadow */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  }

  .dark {
    /* ==================== DARK MODE ==================== */
    
    /* Primary Colors - Keep same for consistency */
    --color-primary-50: 6 78 59;
    --color-primary-100: 6 95 70;
    --color-primary-200: 4 120 87;
    --color-primary-300: 5 150 105;
    --color-primary-400: 16 185 129;
    --color-primary-500: 52 211 153;   /* Brighter for dark bg */
    --color-primary-600: 110 231 183;
    --color-primary-700: 167 243 208;
    --color-primary-800: 209 250 229;
    --color-primary-900: 236 253 245;
    
    /* Secondary Colors - Adjusted for dark mode */
    --color-secondary-50: 30 58 138;
    --color-secondary-100: 30 64 175;
    --color-secondary-200: 29 78 216;
    --color-secondary-300: 37 99 235;
    --color-secondary-400: 59 130 246;
    --color-secondary-500: 96 165 250;  /* Brighter */
    --color-secondary-600: 147 197 253;
    --color-secondary-700: 191 219 254;
    --color-secondary-800: 219 234 254;
    --color-secondary-900: 239 246 255;
    
    /* Accent Colors */
    --color-accent-50: 124 45 18;
    --color-accent-100: 154 52 18;
    --color-accent-200: 194 65 12;
    --color-accent-300: 234 88 12;
    --color-accent-400: 249 115 22;
    --color-accent-500: 251 146 60;    /* Brighter */
    --color-accent-600: 253 186 116;
    --color-accent-700: 254 215 170;
    --color-accent-800: 255 237 213;
    --color-accent-900: 255 247 237;
    
    /* Semantic Colors - Adjusted for visibility */
    --color-success: 74 222 128;       /* Lighter green */
    --color-warning: 250 204 21;       /* Lighter yellow */
    --color-error: 248 113 113;        /* Lighter red */
    --color-info: 96 165 250;          /* Lighter blue */
    
    /* Background Colors */
    --color-background: 17 24 39;      /* Gray-900 */
    --color-surface: 31 41 55;         /* Gray-800 */
    --color-surface-hover: 55 65 81;   /* Gray-700 */
    --color-elevated: 55 65 81;        /* Gray-700 (cards) */
    
    /* Text Colors */
    --color-text-primary: 243 244 246;  /* Gray-100 */
    --color-text-secondary: 209 213 219; /* Gray-300 */
    --color-text-tertiary: 156 163 175; /* Gray-400 */
    --color-text-inverse: 17 24 39;     /* Gray-900 */
    
    /* Border Colors */
    --color-border: 55 65 81;          /* Gray-700 */
    --color-border-hover: 75 85 99;    /* Gray-600 */
    --color-divider: 31 41 55;         /* Gray-800 */
    
    /* Shadow - More subtle in dark mode */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  }
  
  /* Apply background and text to root elements */
  body {
    @apply bg-background text-text-primary transition-colors duration-200;
  }
}
```

### Step 1.3: Update Tailwind Configuration

**Location:** `tailwind.config.ts` or `tailwind.config.js`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // Enable dark mode with class strategy (next-themes uses this)
  darkMode: ["class"],
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // Add custom colors that use CSS variables
      colors: {
        // Primary colors
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
        },
        
        // Secondary colors
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-secondary-500) / <alpha-value>)',
        },
        
        // Accent colors
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-accent-500) / <alpha-value>)',
        },
        
        // Semantic colors
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        
        // Layout colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        
        // Text colors
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        'text-inverse': 'rgb(var(--color-text-inverse) / <alpha-value>)',
        
        // Border colors
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-hover': 'rgb(var(--color-border-hover) / <alpha-value>)',
        divider: 'rgb(var(--color-divider) / <alpha-value>)',
      },
      
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 1.4: Create Theme Provider

**Location:** `src/contexts/ThemeProvider.tsx`

```typescript
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Step 1.5: Update Root Layout

**Location:** `src/app/layout.tsx`

Add the ThemeProvider wrapper:

```typescript
import { ThemeProvider } from '@/contexts/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {/* Your existing providers */}
          <ConvexClientProvider>
            <ClerkProvider>
              {/* ... rest of your app */}
              {children}
            </ClerkProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Note:** Add `suppressHydrationWarning` to the `<html>` tag to prevent hydration warnings.

---

## Phase 2: Color System Design

### Step 2.1: Create Theme Toggle Component

**Location:** `src/components/theme/ThemeToggle.tsx`

```typescript
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder
  }

  return (
    <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-border">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded transition-colors ${
          theme === "light"
            ? "bg-primary text-text-inverse"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        }`}
        title="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded transition-colors ${
          theme === "dark"
            ? "bg-primary text-text-inverse"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        }`}
        title="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded transition-colors ${
          theme === "system"
            ? "bg-primary text-text-inverse"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        }`}
        title="System preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### Step 2.2: Add Toggle to Sidebar

Add the `<ThemeToggle />` component to your sidebar, typically in the header or settings area.

---

## Phase 3: Component Migration

### Migration Strategy

**DO THIS SYSTEMATICALLY - ONE COMPONENT AT A TIME**

### Step 3.1: Color Mapping Reference

Use this reference when migrating components:

#### Old → New Color Mappings

```typescript
// BACKGROUNDS
'bg-white' → 'bg-background'
'bg-gray-50' → 'bg-surface'
'bg-gray-100' → 'bg-surface-hover'
'bg-gray-800' → 'bg-surface'
'bg-gray-900' → 'bg-background'
'bg-gray-700' → 'bg-elevated'

// TEXT
'text-gray-900' → 'text-text-primary'
'text-gray-600' → 'text-text-secondary'
'text-gray-400' → 'text-text-tertiary'
'text-white' → 'text-text-primary'

// BORDERS
'border-gray-200' → 'border-border'
'border-gray-300' → 'border-border-hover'
'border-gray-700' → 'border-border'

// BRAND COLORS
'bg-emerald-500' → 'bg-primary'
'bg-teal-500' → 'bg-primary'
'text-emerald-500' → 'text-primary'
'hover:bg-emerald-600' → 'hover:bg-primary-600'

'bg-blue-500' → 'bg-secondary'
'text-blue-500' → 'text-secondary'

'bg-orange-500' → 'bg-accent'
'text-orange-500' → 'text-accent'

// SEMANTIC
'bg-green-500' → 'bg-success'
'bg-yellow-500' → 'bg-warning'
'bg-red-500' → 'bg-error'
'text-green-500' → 'text-success'
```

### Step 3.2: Component Migration Order

**Phase A - Core Layout (2-3 hours)**
1. ✅ Sidebar (`src/components/layout/Sidebar.tsx`)
2. ✅ Header/Navbar
3. ✅ Footer
4. ✅ Main Layout wrapper

**Phase B - User Interface (3-4 hours)**
5. ✅ Profile Panel (`src/components/profile/SidebarProfilePanel.tsx`)
6. ✅ Notification Panel (`src/components/notifications/SidebarNotificationPanel.tsx`)
7. ✅ Search components
8. ✅ Modals/Dialogs

**Phase C - Feature Components (5-7 hours)**
9. ✅ Project cards/lists
10. ✅ Task components
11. ✅ Event components
12. ✅ Collaboration page
13. ✅ Dashboard widgets
14. ✅ Forms and inputs

**Phase D - Pages (3-4 hours)**
15. ✅ Landing page
16. ✅ Dashboard pages
17. ✅ Admin pages
18. ✅ Settings pages

### Step 3.3: Example Component Migration

**BEFORE:**
```typescript
// Old hardcoded colors
export function Sidebar() {
  return (
    <div className="bg-gray-900 text-white border-gray-700">
      <div className="bg-gray-800 hover:bg-gray-700">
        <h1 className="text-white">BarangayLink</h1>
        <p className="text-gray-400">v2.0.0</p>
      </div>
      <button className="bg-emerald-600 hover:bg-emerald-700 text-white">
        Action
      </button>
    </div>
  );
}
```

**AFTER:**
```typescript
// New theme-aware colors
export function Sidebar() {
  return (
    <div className="bg-background text-text-primary border-border">
      <div className="bg-surface hover:bg-surface-hover">
        <h1 className="text-text-primary">BarangayLink</h1>
        <p className="text-text-secondary">v2.0.0</p>
      </div>
      <button className="bg-primary hover:bg-primary-600 text-text-inverse">
        Action
      </button>
    </div>
  );
}
```

### Step 3.4: Special Cases

#### Gradients
```typescript
// Before
className="bg-gradient-to-r from-emerald-600 to-emerald-700"

// After
className="bg-gradient-to-r from-primary-600 to-primary-700"
```

#### Opacity
```typescript
// Before
className="bg-gray-900/50"

// After
className="bg-background/50"
```

#### Shadows with colors
```typescript
// Before
className="shadow-emerald-500/30"

// After
className="shadow-primary/30"
```

#### Icons
```typescript
// Before
<Bell className="text-gray-400 hover:text-teal-400" />

// After
<Bell className="text-text-secondary hover:text-primary" />
```

---

## Phase 4: Testing & Refinement

### Step 4.1: Testing Checklist

Create a test document and check each item:

```markdown
## Theme Testing Checklist

### Visual Testing
- [ ] All text is readable in both modes
- [ ] Contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- [ ] No "flashing" during theme transitions
- [ ] Images/icons look good in both modes
- [ ] Shadows are visible but not too dark/light

### Component Testing
- [ ] Sidebar (light/dark)
- [ ] Notification panel (light/dark)
- [ ] Profile panel (light/dark)
- [ ] Modals/dialogs (light/dark)
- [ ] Forms and inputs (light/dark)
- [ ] Buttons (all variants)
- [ ] Cards and surfaces
- [ ] Tables and lists
- [ ] Charts and graphs

### Functionality Testing
- [ ] Theme persists after page reload
- [ ] System preference detection works
- [ ] Theme toggle animates smoothly
- [ ] No hydration warnings in console
- [ ] localStorage saves theme preference
- [ ] Works on mobile devices

### Third-Party Components
- [ ] Clerk UI components themed correctly
- [ ] Convex data displays correctly
- [ ] Maps (Mapbox) are readable
- [ ] PDF exports maintain readability
- [ ] Email templates (if using theme colors)
```

### Step 4.2: Accessibility Testing

Use browser DevTools or online tools:

1. **Contrast Checker:** https://webaim.org/resources/contrastchecker/
2. **Lighthouse Audit** (Chrome DevTools)
3. **axe DevTools** extension

### Step 4.3: Common Issues & Fixes

**Issue: Text not readable on certain backgrounds**
```typescript
// Solution: Ensure proper contrast
// Use text-text-primary instead of text-gray-500
```

**Issue: Transitions look jarring**
```css
/* Add to globals.css */
* {
  @apply transition-colors duration-200;
}
```

**Issue: Hydration mismatch warnings**
```typescript
// Always use suppressHydrationWarning on <html> tag
<html lang="en" suppressHydrationWarning>
```

**Issue: Theme flickers on page load**
```typescript
// Ensure ThemeProvider is high in component tree
// Use next-themes script in <head> if needed
```

---

## Advanced Features (Optional)

### Custom Theme Colors per Department

You can create multiple theme variants:

```typescript
// src/lib/themes.ts
export const themes = {
  default: {
    primary: '16 185 129', // Emerald
  },
  executive: {
    primary: '139 92 246', // Purple
  },
  health: {
    primary: '59 130 246', // Blue
  },
  infrastructure: {
    primary: '234 88 12', // Orange
  },
};

// Apply dynamically based on user's department
```

### High Contrast Mode

```css
/* Add to globals.css */
.high-contrast {
  --color-text-primary: 0 0 0;
  --color-background: 255 255 255;
  --color-border: 0 0 0;
  /* Maximum contrast for accessibility */
}
```

---

## 📊 Project Timeline

### Week 1
- **Day 1-2:** Complete Phase 1 (Setup)
- **Day 3:** Create and test ThemeToggle component
- **Day 4-5:** Migrate Sidebar and core layouts

### Week 2
- **Day 1-2:** Migrate user interface components
- **Day 3-4:** Migrate feature components
- **Day 5:** Migrate pages

### Week 3
- **Day 1-2:** Testing and bug fixes
- **Day 3:** Accessibility audit
- **Day 4-5:** Polish and documentation

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install next-themes

# 2. Test theme toggle
npm run dev

# 3. Check for color inconsistencies
# Search for hardcoded colors in your codebase:
# VS Code: Ctrl+Shift+F
# Search regex: (bg|text|border)-(gray|white|black|emerald|teal|blue)-\d+

# 4. Build and test
npm run build
npm start
```

---

## 📝 Best Practices

### DO ✅
- Use semantic color names (`bg-surface` not `bg-gray-100`)
- Test both themes after each component migration
- Keep theme toggle easily accessible
- Use system preference as default
- Add transitions for smooth theme switching
- Document custom color usage

### DON'T ❌
- Hardcode hex colors in components
- Skip testing contrast ratios
- Mix old and new color systems
- Forget to update third-party components
- Remove transition classes
- Use `dark:` prefix everywhere (that's the old way)

---

## 🔗 Resources

- **next-themes:** https://github.com/pacocoursey/next-themes
- **Tailwind Dark Mode:** https://tailwindcss.com/docs/dark-mode
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **CSS Variables Guide:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

## 💡 Tips for Success

1. **Start small:** Migrate one component fully before moving to next
2. **Use find & replace carefully:** Don't blindly replace all colors
3. **Test frequently:** Switch themes every 15-30 minutes during development
4. **Get feedback:** Ask team members or users to test both themes
5. **Document edge cases:** Note any components that need special handling
6. **Keep a changelog:** Track which components are migrated

---

## ✨ Expected Results

After implementation, you should have:

- ✅ Smooth light/dark mode switching
- ✅ System preference detection
- ✅ Persistent theme selection
- ✅ Consistent colors across all components
- ✅ Accessible contrast ratios
- ✅ Easy to maintain color system
- ✅ Future-proof for custom themes

---

**Good luck with the implementation! Take it one step at a time.** 🎨
