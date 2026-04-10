---
name: frontend-theme
description: Load the design system before writing any UI code. Enforces consistent visual language across all dashboards and interfaces.
triggers: ["UI code", "dashboard", "frontend", "build a page", "design system", "component"]
---

# Frontend Theme

Load this before writing ANY UI code. No exceptions.

## Core Design Principles

- Dark background, light text
- High contrast for readability
- Minimal chrome -- UI should disappear, content should shine
- Every element earns its space

## Color Palette

```css
/* Backgrounds */
--bg-primary: #0a0a0a;      /* Main background */
--bg-secondary: #111111;    /* Card/panel background */
--bg-tertiary: #1a1a1a;     /* Elevated surfaces */
--bg-hover: #222222;        /* Hover states */

/* Text */
--text-primary: #ffffff;    /* Main text */
--text-secondary: #999999;  /* Muted text */
--text-tertiary: #555555;   /* Very muted */

/* Accent */
--accent: #22c55e;          /* Green -- primary action */
--accent-hover: #16a34a;    /* Darker green on hover */
--accent-muted: #166534;    /* Background for accent elements */

/* Status */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Borders */
--border: #222222;
--border-light: #333333;
```

## Typography

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

## Component Patterns

### Card
```html
<div class="rounded-lg border border-[#222] bg-[#111] p-4">
  <!-- content -->
</div>
```

### Button (Primary)
```html
<button class="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-md transition-colors">
  Action
</button>
```

### Button (Secondary)
```html
<button class="border border-[#333] text-[#999] hover:text-white hover:border-[#555] px-4 py-2 rounded-md transition-colors">
  Action
</button>
```

### Input
```html
<input class="bg-[#111] border border-[#333] text-white placeholder-[#555] rounded-md px-3 py-2 w-full focus:outline-none focus:border-green-500" />
```

## Layout Rules

- Max content width: 1280px, centered
- Sidebar: 240px fixed, content area fills remaining
- Card padding: 16px (p-4) or 24px (p-6) for larger cards
- Gap between cards: 16px (gap-4)
- Page padding: 24px horizontal on desktop, 16px on mobile

## Tailwind Config

Use Tailwind. Configure with the above colors as custom values.

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: '#22c55e',
        'bg-secondary': '#111111',
      }
    }
  }
}
```
