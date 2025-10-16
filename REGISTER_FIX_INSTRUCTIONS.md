# Register Page - Complete Fix Instructions

## Current Issues:
1. ❌ Duplicate eye icons on password fields (similar to login page issue)
2. ❌ Glitch animation on First Name and Last Name fields
3. ❌ No clear button on Phone Number field  
4. ❌ Missing social sign-in options (Google, Facebook, TikTok)
5. ❌ Design needs polish

## Solution Approach:

Since the file is 52KB (1211 lines), I recommend creating a NEW streamlined register page.

## Key Changes Needed:

### 1. Remove All Glitch Code
**Lines to delete: 142-255 (all three useEffect glitch animations)**
- Remove glitch animation for job title (lines 142-187)
- Remove glitch animation for first name (lines 189-221)
- Remove glitch animation for last name (lines 223-255)

### 2. Remove Password Toggle Buttons
**Search for: `showPassword`, `showConfirmPassword`, `Eye`, `EyeOff`**
- Remove state variables (lines 129-130 - ALREADY DONE)
- Remove toggle buttons from password inputs
- Change password inputs to always `type="password"`
- Let Clerk handle the show/hide functionality

### 3. Add Clear Button to Phone Number
**Find phone number input and add:**
```tsx
{basicInfo.phone && (
  <button
    type="button"
    onClick={() => setBasicInfo(prev => ({ ...prev, phone: '' }))}
    className="absolute right-3 top-1/2 transform -translate-y-1/2"
  >
    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
  </button>
)}
```

### 4. Add Social Sign-In (Clerk OAuth)
**Add before the main registration form:**
```tsx
{/* Social Sign-In Options */}
<div className="space-y-3 mb-6">
  <button
    type="button"
    onClick={() => signUp.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/dashboard',
      redirectUrlComplete: '/dashboard'
    })}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-lg transition-colors border border-gray-300"
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      {/* Google icon SVG */}
    </svg>
    Continue with Google
  </button>
  
  <button
    type="button"
    onClick={() => signUp.authenticateWithRedirect({
      strategy: 'oauth_facebook',
      redirectUrl: '/dashboard',
      redirectUrlComplete: '/dashboard'
    })}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#0C63D4] text-white rounded-lg transition-colors"
  >
    <Facebook className="w-5 h-5" />
    Continue with Facebook
  </button>
</div>

<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-700"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-4 bg-gray-800 text-gray-400">Or register with email</span>
  </div>
</div>
```

### 5. Fix Name Fields (Remove Glitch)
**Replace the glitch input sections with simple inputs:**
```tsx
<input
  type="text"
  value={basicInfo.firstName}
  onChange={(e) => setBasicInfo(prev => ({ ...prev, firstName: e.target.value }))}
  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
  placeholder="Enter your first name"
  required
/>
```

### 6. Design Improvements
- Add gradient backgrounds: `bg-gradient-to-br from-gray-800 to-gray-900`
- Add hover effects: `hover:-translate-y-0.5 transition-all`
- Better spacing: increase padding and margins
- Improve progress indicators with animations

## Recommendation:
Due to file size, I suggest we create a NEW, clean register page file that incorporates all improvements from scratch.

Would you like me to:
A) Create a completely new register page (recommended)
B) Continue with targeted edits to existing file
C) Create a detailed line-by-line edit plan
