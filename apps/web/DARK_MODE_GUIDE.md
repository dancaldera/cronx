# Dark Mode Implementation Guide

This document explains how dark mode is implemented in the CronX web application using Next.js 15, Tailwind CSS 4, and next-themes.

## Overview

The dark mode implementation uses:
- **Next.js 15** with App Router
- **Tailwind CSS 4** for styling with dark mode variants
- **next-themes** for theme management and persistence
- **Class-based theme switching** for better performance

## Architecture

### Theme Provider Setup

The theme system is initialized in the root layout using `next-themes`:

```tsx
// src/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Configuration

- **attribute**: "class" - Uses CSS classes for theme switching
- **defaultTheme**: "system" - Respects user's OS preference by default
- **enableSystem**: true - Allows automatic system theme detection
- **disableTransitionOnChange**: false - Enables smooth transitions

### Global Styles

The global CSS is configured for Tailwind 4 with the required custom variant:

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Custom variant for dark mode - REQUIRED for Tailwind CSS 4 with next-themes */
@custom-variant dark (&:where(.dark, .dark *));

/* Ensure smooth transitions for theme changes */
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

/* Fix for next-themes hydration */
[data-theme] {
  color-scheme: light;
}

[data-theme="dark"] {
  color-scheme: dark;
}

/* Custom scrollbar for better dark mode support */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-lg;
}
```

**Important:** The `@custom-variant dark (&:where(.dark, .dark *));` line is crucial for Tailwind CSS 4 to recognize and apply dark mode classes properly with class-based theme switching.

## Theme Switcher Component

The theme switcher provides a dropdown interface for theme selection:

```tsx
// src/components/ui/theme-switcher.tsx
import { useTheme } from "next-themes";

const themeOptions = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "💻" },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  // Component implementation...
}
```

## Dark Mode Patterns

### Basic Class Structure

All components use Tailwind's dark mode variants:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

### Color Mapping

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `bg-white` | `dark:bg-gray-800` |
| Secondary BG | `bg-gray-50` | `dark:bg-gray-900` |
| Text Primary | `text-gray-900` | `dark:text-white` |
| Text Secondary | `text-gray-600` | `dark:text-gray-400` |
| Borders | `border-gray-300` | `dark:border-gray-600` |
| Input BG | `bg-white` | `dark:bg-gray-800` |

### Form Elements

```tsx
<input
  className="
    w-full px-3 py-2 
    border border-gray-300 dark:border-gray-600 
    bg-white dark:bg-gray-800 
    text-gray-900 dark:text-white 
    placeholder-gray-500 dark:placeholder-gray-400
    focus:ring-indigo-500 focus:border-indigo-500
  "
/>
```

### Status Colors

Status indicators maintain accessibility in both themes:

```tsx
// Success
className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900"

// Error
className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900"

// Warning
className="text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900"

// Info
className="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900"
```

## Hydration Prevention

To prevent hydration mismatches, the root HTML includes `suppressHydrationWarning`:

```tsx
// src/app/layout.tsx
<html lang="en" suppressHydrationWarning>
```

## Component Implementation Examples

### Dashboard Layout

```tsx
<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
  <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
    <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">CronX</h1>
  </div>
</div>
```

### Form Pages

```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
  <div className="max-w-md w-full space-y-8">
    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
      Sign in to CronX
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      HTTP Automation Platform
    </p>
  </div>
</div>
```

### Cards and Content

```tsx
<div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
  <div className="p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
      Card Title
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Card description
    </p>
  </div>
</div>
```

## Testing

A test page is available at `/theme-test` to verify all dark mode implementations:

```tsx
// Accessible via: http://localhost:3000/theme-test
```

This page includes:
- Theme switching controls
- Color palette examples
- Form element variations
- Button variants
- Status indicators

## Best Practices

1. **Always pair light and dark variants**: Every color class should have a dark mode equivalent
2. **Use semantic color names**: Prefer `text-gray-900 dark:text-white` over specific color values
3. **Test contrast ratios**: Ensure accessibility standards are met in both themes
4. **Use transitions**: Add smooth transitions for better UX during theme changes
5. **Consider loading states**: Handle theme hydration properly to prevent flashing

## Troubleshooting

### Common Issues

1. **Dark mode classes not applying**: Add `@custom-variant dark (&:where(.dark, .dark *));` to your global CSS - this is required for Tailwind CSS 4
2. **Flashing on load**: Ensure `suppressHydrationWarning` is set on the HTML element
3. **Missing dark variants**: Check that all color classes have `dark:` counterparts
4. **Form elements not themed**: Verify input backgrounds and borders include dark variants
5. **Icons not visible**: Ensure icon colors work in both themes

### Debug Theme State

```tsx
import { useTheme } from "next-themes";

function DebugTheme() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <p>System theme: {systemTheme}</p>
    </div>
  );
}
```

## Migration from Custom Implementation

The previous custom theme context has been replaced with `next-themes` for:
- Better SSR/SSG support
- Automatic system theme detection
- Proper hydration handling
- Simpler API surface

All components have been updated to use the standard Tailwind dark mode classes with the new theme provider.

## Tailwind CSS 4 Specific Requirements

**Critical Fix for Tailwind CSS 4:**

If dark mode classes are not applying (you see dark mode even when light mode is selected), you MUST add this line to your global CSS:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

This custom variant tells Tailwind CSS 4 how to handle the `.dark` class that `next-themes` applies to the HTML element. Without this, the dark mode classes won't work properly with class-based theme switching.