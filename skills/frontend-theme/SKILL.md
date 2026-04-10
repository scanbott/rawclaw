---
name: frontend-theme
description: Enforces the Rawgrowth.ai design system on all frontend development. Injects the full token set, typography rules, component patterns, and layout conventions before any UI code is written. Triggers on "build a frontend", "build a UI", "build a dashboard", "create a page", "design a component", or any request involving HTML/CSS/React/Next.js/Tailwind output.
user-invocable: true
---

# Frontend Theme -- Rawgrowth Design System

**Flow:** Load tokens -> Apply typography -> Apply layout -> Apply components -> Apply atmosphere -> Build -> Verify

No deviations. Every frontend output matches rawgrowth.ai unless Chris explicitly says otherwise.

Source of truth: `/Users/scanbot/Desktop/rawgrowth-website/`

---

## CRITICAL RULES (read before writing a single line of UI)

- No emojis. Ever.
- Dark theme only. Never light mode.
- Primary green (#0CBF6A) is the ONLY accent color. No blues, purples, oranges.
- No generic SaaS aesthetics (white cards, blue buttons, flat design).
- Neue Haas Display for body/UI. Editor's Note (serif/italic) for display headings only.
- Borders are always rgba(255,255,255,0.06) -- barely visible, not heavy.
- Every page gets the noise texture and at least one green radial glow.

---

## Step 1: Color Tokens

Use these exact values. No approximations.

```css
:root {
  /* Backgrounds */
  --background: #060B08;                       /* page bg */
  --card: #0A1210;                             /* card/surface bg */
  --popover: #0A1210;

  /* Text */
  --foreground: rgba(255,255,255,0.92);        /* primary text */
  --muted-foreground: rgba(255,255,255,0.6);   /* secondary text */
  --subdued: rgba(255,255,255,0.35);           /* captions, footnotes */

  /* Brand */
  --primary: #0CBF6A;                          /* CTA buttons, links, active states */
  --primary-foreground: #ffffff;
  --secondary: rgba(10,148,82,0.08);           /* subtle tinted surfaces */
  --accent: rgba(10,148,82,0.04);

  /* Structure */
  --border: rgba(255,255,255,0.06);            /* all dividers and card borders */
  --input: rgba(255,255,255,0.10);             /* form inputs */
  --muted: rgba(255,255,255,0.03);             /* barely-there surface */
  --ring: #0CBF6A;                             /* focus rings */
  --destructive: #ef4444;

  /* Radius */
  --radius: 0.625rem;
}
```

Tailwind shorthand:
```js
// tailwind.config.js extend.colors
background: '#060B08',
card: '#0A1210',
primary: '#0CBF6A',
border: 'rgba(255,255,255,0.06)',
```

---

## Step 2: Typography

**Font stack:**
- UI/body: `Neue Haas Display` (300 light, 500 medium, 700 bold) via var(--font-sans)
- Display headings w/ italic accent: `Editor's Note` (400) via var(--font-serif)
- Fallback if local fonts unavailable: Inter (sans), Playfair Display (serif)

**Scale:**
```
Hero H1:     clamp(2.6rem, 6vw, 4.5rem)   font-serif   tracking-[-0.02em]   leading-[1.05]
Section H2:  clamp(1.8rem, 4vw, 3rem)     font-serif   tracking-[-0.015em]  leading-[1.1]
H3:          clamp(1.2rem, 2.5vw, 1.6rem) font-sans    font-medium
Body large:  1.1-1.25rem  font-light  leading-[1.8]  text-[rgba(255,255,255,.6)]
Body:        1rem          font-light  leading-[1.7]  text-[rgba(255,255,255,.6)]
Caption:     0.8125rem    font-light                 text-[rgba(255,255,255,.35)]
Label/tag:   0.75rem      font-medium  uppercase tracking-widest  text-primary
```

**Italic accent pattern (for hero headings):**
```tsx
<h1 className="font-serif text-[clamp(2.6rem,6vw,4.5rem)] tracking-[-0.02em] leading-[1.05]">
  Stop Being The Bottleneck.{" "}
  <span className="font-serif italic text-primary">Install AI.</span>
</h1>
```

---

## Step 3: Layout Conventions

**Container:**
```tsx
<div className="mx-auto max-w-[1200px] px-6 xl:max-w-[1400px]">
```

**Section spacing:**
```
Standard: py-[80px] xl:py-[100px] 2xl:py-[120px]
Hero:     pt-[160px] pb-[80px] xl:pt-[190px] xl:pb-[100px]
```

**Grids:**
```
2-col:  grid grid-cols-1 gap-6 md:grid-cols-2
3-col:  grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3
4-col:  grid grid-cols-2 gap-4 md:grid-cols-4
```

---

## Step 4: Component Patterns

### Primary CTA Button
```tsx
<button className="btn-shine inline-flex items-center gap-2.5 rounded-xl bg-primary px-10 py-4 text-[15px] font-bold text-white transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 active:translate-y-0">
  Apply Now &rarr;
</button>
```

Required CSS for btn-shine:
```css
.btn-shine {
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.05) 40%, transparent 50%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 0 40px rgba(12,191,106,.25), 0 4px 24px rgba(0,0,0,.4);
}
.btn-shine:hover {
  box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 0 60px rgba(12,191,106,.3), 0 8px 40px rgba(0,0,0,.5);
}
.btn-shine::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,.12);
  border-bottom-color: transparent;
  pointer-events: none;
}
```

### Ghost / Secondary Button
```tsx
<button className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,.12)] bg-transparent px-8 py-4 text-sm font-medium text-[rgba(255,255,255,.7)] transition-colors hover:border-primary/40 hover:text-white">
  Learn More
</button>
```

### Card
```tsx
<div className="rounded-xl border border-[rgba(255,255,255,.06)] bg-[#0A1210] p-6">
```

### Card with green accent top line
```tsx
<div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,.06)] bg-[#0A1210] p-6">
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
```

### Input
```tsx
<input className="w-full rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,.3)] outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
```

### Section Label / Tag
```tsx
<p className="mb-4 text-xs font-medium uppercase tracking-widest text-primary">Services</p>
```

### Stat / Metric
```tsx
<div className="text-center">
  <div className="font-serif text-[clamp(2rem,4vw,3.5rem)] text-primary">$20K</div>
  <div className="mt-1 text-sm font-light text-[rgba(255,255,255,.5)]">install fee</div>
</div>
```

---

## Step 5: Atmosphere (Required on Every Page)

This is what separates Rawgrowth from generic SaaS. Do not skip.

### Noise texture (on body):
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

### Dot grid with radial fade:
```tsx
<div
  className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_10%,transparent_60%)]"
  style={{
    backgroundImage: "radial-gradient(rgba(12,191,106,.12) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
  }}
/>
```

### Green radial glows (minimum: hero + one mid-page):
```tsx
{/* Hero glow */}
<div className="pointer-events-none absolute -top-[200px] left-1/2 h-[1000px] w-[1200px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(12,191,106,.07)_0%,transparent_60%)]" />
{/* Mid-page glow */}
<div className="pointer-events-none absolute left-1/2 top-[40%] h-[800px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(12,191,106,.035)_0%,transparent_65%)]" />
```

---

## Step 6: Reveal Animations

Stagger delays 100ms per element.

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
  viewport={{ once: true }}
>
```

Or CSS-only:
```tsx
<div className="translate-y-4 opacity-0 transition-all duration-700 ease-out data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100">
```

---

## Step 7: Global Styles Baseline

Always include:
```css
html { scroll-behavior: smooth; overflow-x: hidden; }
body {
  background: var(--background);
  color: var(--foreground);
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
::selection { background: #0CBF6A; color: #fff; }
```

---

## Step 8: Pre-Build Checklist

Before writing any component:

- [ ] Background is #060B08 (not pure black, not gray)
- [ ] Only accent is #0CBF6A
- [ ] No emojis
- [ ] Fonts: Neue Haas Display or Inter fallback
- [ ] Border color is rgba(255,255,255,0.06)
- [ ] Noise texture included
- [ ] At least one green radial glow
- [ ] CTAs use btn-shine
- [ ] Text: 0.92 primary / 0.6 secondary / 0.35 subdued
- [ ] Zero light backgrounds (cards are #0A1210, not white)

---

## Step 9: Tech Stack Defaults

```
Framework:    Next.js 15 (App Router)
Styling:      Tailwind CSS v4
Components:   shadcn/ui (dark theme, tokens above)
Animations:   Framer Motion
Icons:        Lucide React
Fonts:        next/font/local (Neue Haas) or next/font/google (Inter fallback)
```

---

## Error Handling

| Problem | Solution |
|---------|----------|
| Local fonts unavailable | Inter (sans) + Playfair Display (serif) from Google Fonts |
| Tailwind v3 | Define colors in tailwind.config.js extend.colors |
| Plain HTML | Inline CSS vars in :root, use vanilla CSS classes |
| Dashboard context | Keep all tokens, reduce glows to single hero glow |
| Client override requested | Note deviation in code comment, apply only overridden parts |
