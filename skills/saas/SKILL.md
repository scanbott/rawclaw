---
name: saas
description: Full-stack SaaS builder. Give it an idea, it researches the market, plans the architecture, asks clarifying questions, builds the entire product (backend, auth, app UI, landing page, transactional email), runs E2E tests, reviews all code, and deploys to Vercel. One command, working SaaS.
user-invocable: true
---

# /saas — Full-Stack SaaS Builder

**Trigger:** `/saas [idea]` or just `/saas` (will prompt for idea)

**Output:** A fully deployed, production-ready SaaS at a Vercel URL. Working auth, real backend, live data, beautiful UI. Not a demo. Not a scaffold. A real product.

---

## PIPELINE OVERVIEW

```
INTAKE → RESEARCH (parallel) → PLAN → CLARIFY → BUILD → TEST → REVIEW → DEPLOY
```

Each phase gates the next. No shortcuts. No skipping.

---

## PHASE 1 — INTAKE

If the user ran `/saas [idea]`, extract the idea from the command.
If they ran `/saas` with no argument, ask:

```
What's the SaaS idea? Describe it in 1-3 sentences. Include:
- What it does
- Who it's for
- What problem it solves
```

Store as `IDEA`. Confirm back in one sentence before proceeding.

---

## PHASE 2 — PARALLEL RESEARCH

Spin off two research tracks simultaneously using the Agent tool. Do NOT wait for one before starting the other.

### Track A — Market Intelligence
Spawn a `general-purpose` agent with this prompt:

```
Research the SaaS market for this idea: [IDEA]

Deliver a structured report covering:

1. EXISTING PLAYERS (5-8 competitors)
   - Name, URL, pricing tiers, positioning
   - What they do well, what they miss
   - Estimated ARR if available

2. MARKET SIZE & DEMAND
   - Category (CRM, project mgmt, analytics, etc.)
   - Market size estimate
   - Growth trend (growing/flat/declining)
   - Evidence of demand (Reddit threads, ProductHunt upvotes, job postings)

3. PRICING BENCHMARKS
   - Freemium vs paid-only vs trial
   - Typical price points ($/user/mo, flat, usage-based)
   - Which models win in this category

4. FEATURE TABLE
   - List the 10 most common features across competitors
   - Mark which ones are table-stakes vs differentiators

5. WHITE SPACE
   - What are competitors NOT doing?
   - Where do users complain? (check G2, Capterra, Reddit)
   - What's the wedge opportunity?

Return structured markdown. Be specific. No fluff.
```

### Track B — Technical Pattern Research
Spawn a second `general-purpose` agent:

```
Research the technical implementation patterns for this type of SaaS: [IDEA]

Deliver:

1. DATA MODEL PATTERNS
   - What tables/entities does this type of app typically need?
   - Key relationships and constraints
   - Multi-tenancy approach (row-level org_id vs separate schemas)

2. AUTH PATTERNS
   - Does this type of app need social login? Magic link? SSO?
   - Invite-only vs open signup?
   - Role patterns (admin/member/viewer typical?)

3. BILLING PATTERNS
   - Per-seat, usage-based, or flat?
   - Free tier strategy that works in this space?

4. INTEGRATION NEEDS
   - What do apps in this category typically integrate with?
   - Webhooks, Zapier, API keys?

5. TECHNICAL RISKS
   - What's hard to build in this category?
   - What do teams get wrong?
   - Performance/scale considerations

Return structured markdown. Be specific.
```

Wait for BOTH tracks to complete before proceeding.

---

## PHASE 3 — ARCHITECTURE PLAN

Using both research outputs, produce a structured build plan. Write this to `.saas-workspace/[project-slug]/PLAN.md`.

The plan must include:

### 3.1 Product Definition
```markdown
## Product
Name: [derived from idea, can be changed]
Tagline: [one line]
Core value prop: [one sentence]
Target user: [specific persona]

## MVP Feature Set (what we're building TODAY)
- [Feature 1] — [why it's in scope]
- [Feature 2] — [why it's in scope]
...

## Out of Scope (v1)
- [Feature] — [defer to v2 because...]
```

### 3.2 Data Model
Design the complete Postgres schema. For every table:
- Table name, purpose
- All columns with types, constraints, defaults
- Foreign key relationships
- RLS policies needed
- Indexes

Start with these required tables:
```sql
-- Always include:
profiles (extends auth.users)
organizations (if multi-tenant)
organization_members (if multi-tenant)
subscriptions (if billing)
```

Then add domain-specific tables for the product.

### 3.3 Route Map
```
Landing page:      /
Auth:              /login  /signup  /auth/callback
App shell:         /app (requires auth)
Core features:     /app/[feature] (one per MVP feature)
Settings:          /app/settings
API routes:        /api/... (list each)
```

### 3.4 Tech Stack Confirmation
```
Framework:    Next.js 15 (App Router, TypeScript)
Database:     Supabase (Postgres + Auth + RLS)
Styling:      Tailwind CSS v4 + shadcn/ui
Email:        Resend (transactional)
Deploy:       Vercel
Payments:     Stripe (if billing needed)
```

### 3.5 Build Order
List the exact sequence: migrations → auth → API routes → app shell → features → landing page → email templates → tests.

---

## PHASE 4 — CLARIFYING QUESTIONS

Before writing a single line of code, surface gaps. Use `AskUserQuestion` to ask the following (group into max 4 questions per call):

**Round 1 — Product Scope:**
1. Confirm the name (present 3 options derived from the idea)
2. Multi-tenant (teams/orgs) or single-user accounts?
3. Does v1 need payments/billing, or is it free while building?
4. Any specific features from the research that are must-haves vs nice-to-haves?

**Round 2 — Design & Deployment (only ask if answers from Round 1 raise new questions):**
- Domain? (or use Vercel subdomain for now)
- Any brand colors / preferences? (default: Rawgrowth dark green system)
- Email sender address for Resend?

Incorporate answers into the PLAN.md before proceeding.

---

## PHASE 5 — BUILD

### Pre-Build Setup

Load these skills before writing any code:
1. `frontend-theme` — injects full Rawgrowth design system
2. `ui-ux-pro-max` — design decisions, palette, typography
3. Invoke Magic MCP (`@21st-dev/magic`) for any complex components

**Project location:** Create at `~/saas-projects/[project-slug]/`

**Scaffold command:**
```bash
cd ~/saas-projects
npx create-next-app@latest [project-slug] \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
cd [project-slug]
```

**Install dependencies:**
```bash
npm install @supabase/supabase-js @supabase/ssr \
  resend \
  @radix-ui/react-icons \
  lucide-react \
  class-variance-authority clsx tailwind-merge \
  zod \
  @hookform/resolvers react-hook-form

# shadcn/ui init
npx shadcn@latest init --defaults

# Add shadcn components
npx shadcn@latest add button input label card \
  dropdown-menu avatar badge separator toast \
  dialog sheet tabs form
```

**Tailwind v4 config** — apply frontend-theme tokens to `src/app/globals.css`.

---

### 5.1 Database & Migrations

Use the `add-migration` skill for each migration.

**Migration 1: Core schema**
```sql
-- Enable RLS on all user-facing tables
-- profiles: extends auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Migration 2: Organizations (if multi-tenant)**
```sql
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Members can view org membership"
  ON organization_members FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  ));
```

**Migration 3+: Domain tables** — create product-specific tables per the data model in PLAN.md. Apply RLS to every table.

---

### 5.2 Supabase Client Setup

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

`src/middleware.ts` — protect all `/app/*` routes, redirect unauthenticated users to `/login`.

---

### 5.3 Auth Pages

Build `/login` and `/signup` as full pages (not modals). Apply frontend-theme:
- Dark background (#060B08)
- Centered card with border (rgba(255,255,255,0.06))
- Green CTA buttons (#0CBF6A)
- Email + password fields (+ social login if configured)
- "Forgot password" link
- No emojis. Clean, premium, minimal.

`src/app/(auth)/login/page.tsx` — login form with Supabase Auth
`src/app/(auth)/signup/page.tsx` — signup form with email confirmation flow
`src/app/auth/callback/route.ts` — OAuth/magic link callback handler

**Email confirmation flow:**
- On signup → Supabase sends confirmation email (via Resend SMTP)
- Callback route exchanges code for session
- Redirect to `/app/dashboard` on success

---

### 5.4 App Shell

`src/app/(app)/layout.tsx` — authenticated layout with:
- Sidebar (collapsible on mobile)
- Top nav with user avatar + dropdown (profile, settings, sign out)
- Breadcrumbs
- Toast notification outlet

Sidebar items derived from route map in PLAN.md.

Use Magic MCP to fetch a sidebar component: search for "dashboard sidebar dark" and adapt to frontend-theme tokens.

---

### 5.5 Core Feature Pages

For each feature in the MVP feature set (from PLAN.md):

1. **Design first** — query Magic MCP for relevant component patterns
2. **Data layer** — server components fetch from Supabase directly
3. **Mutations** — Server Actions with Zod validation
4. **Error states** — every form has validation errors, loading states, empty states
5. **No `any` types** — generate TypeScript types from Supabase schema

Pattern for data-fetching server component:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FeaturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return <FeatureClient data={data} />
}
```

---

### 5.6 Landing Page

The landing page lives at `/` (outside the auth layout). This is a marketing page, not the app.

**Required sections (in order):**
1. **Hero** — headline, subheadline, primary CTA (sign up), secondary CTA (see demo or scroll)
2. **Social proof** — logos or quote from target persona (use placeholder if no real customers)
3. **Problem** — 3 pain points the product solves
4. **Solution/Features** — 3-4 features with icons + description
5. **How it works** — 3-step process
6. **Pricing** — 2-3 tiers (even if free for now, lay it out)
7. **FAQ** — 5 common questions
8. **CTA footer** — repeat the sign-up CTA

**Design rules for landing page:**
- Load `frontend-theme` — dark green system, same as the app
- Load `ui-ux-pro-max` — pick a style that matches the product category
- Use Magic MCP for hero section, pricing cards, feature cards
- Noise texture + green radial glow on hero section
- Animate hero headline entrance (opacity + translateY, 0.6s ease-out)
- No `transition-all` anywhere
- Mobile-first, test at 375px, 768px, 1280px

---

### 5.7 Transactional Emails (Resend)

Create `src/lib/email/` with:

**`resend.ts`** — client init:
```typescript
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)
```

**Email templates** (React Email components in `src/emails/`):

1. `welcome.tsx` — sent after email confirmation
   - Clean, branded (dark bg, green accent)
   - One clear next step CTA
   - Personal tone

2. `invite.tsx` — team invite (if multi-tenant)
   - Who invited them, what org
   - Accept invite CTA

3. `password-reset.tsx` — password reset
   - Short, functional, no fluff

**Email API route** `src/app/api/email/route.ts`:
```typescript
import { resend } from '@/lib/email/resend'
import { WelcomeEmail } from '@/emails/welcome'

export async function POST(req: Request) {
  const { to, type, data } = await req.json()
  // Route to correct template based on type
}
```

---

### 5.8 Environment Variables

Generate `.env.local.example`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=[App Name]

# Stripe (if billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Also generate a populated `.env.local` by reading existing keys from `~/.zshrc` or `.env` files if the same services are already configured.

---

## PHASE 6 — END-TO-END TESTING

**Do not skip this phase.** "It compiled" is not a test.

Start the dev server: `npm run dev`

Use Playwright (via `mcp__playwright__*` tools) to run every test below. For each test: navigate, interact, assert.

### Auth Flow Tests
- [ ] Load landing page → visible, no console errors
- [ ] Click "Sign Up" → lands on `/signup`
- [ ] Fill in email + password → submits → confirmation message shown
- [ ] Load `/login` → fill credentials → submits → redirects to `/app/dashboard`
- [ ] While logged in, visit `/login` → redirects to `/app/dashboard`
- [ ] While logged out, visit `/app/dashboard` → redirects to `/login`
- [ ] Sign out from dropdown → redirects to landing page, session cleared

### Core Feature Tests
For each MVP feature:
- [ ] Load the feature page (no 500, no blank state errors)
- [ ] Create a record (form submit → appears in list)
- [ ] Read/view the record
- [ ] Update the record (if edit exists)
- [ ] Delete the record (if delete exists)
- [ ] Empty state renders correctly when no data

### Landing Page Tests
- [ ] All sections visible
- [ ] All CTA buttons clickable and navigate correctly
- [ ] No broken images or missing fonts
- [ ] Mobile viewport (375px) — no horizontal scroll, text readable

### Email Tests (check Resend logs or test inbox)
- [ ] Signup triggers welcome email delivery attempt
- [ ] No API errors in Resend dashboard

### Console Error Scan
After all tests: `mcp__playwright__browser_console_messages` with level "error".
Zero console errors allowed before deploy.

**Fix any failures before proceeding to Phase 7.**

---

## PHASE 7 — CODE REVIEW

One final pass over all generated code. Check every file for:

### Security
- [ ] No secrets in client-side code (`NEXT_PUBLIC_` only for public keys)
- [ ] All Supabase queries use RLS (no service role key in client components)
- [ ] All form inputs validated with Zod before database writes
- [ ] No SQL injection vectors (parameterized queries only — Supabase handles this)
- [ ] Auth checks on every API route and server action

### Quality
- [ ] No `any` TypeScript types
- [ ] No `console.log` left in production code
- [ ] No hardcoded URLs (use `NEXT_PUBLIC_APP_URL`)
- [ ] No dead code or unused imports
- [ ] All async operations have error handling

### Performance
- [ ] Images use Next.js `<Image>` component
- [ ] No blocking fetches in client components (use server components for data)
- [ ] Landing page sections are lazy-loaded below the fold

### Design
- [ ] Every interactive element has hover + focus states
- [ ] No `transition-all` used anywhere
- [ ] Loading states exist for all async operations
- [ ] Mobile-responsive (no overflow issues)

Fix everything found. Re-run the dev server and do a final visual check with Playwright.

---

## PHASE 8 — DEPLOY

### 8.1 Build Check
```bash
npm run build
```
Fix ALL TypeScript errors and build warnings. Zero tolerance for broken builds.

### 8.2 Vercel Deploy
```bash
vercel --yes
```

Then alias to the stable preview URL:
```bash
vercel alias set [deployment-url] [project-slug]-preview.vercel.app
```

### 8.3 Vercel Environment Variables
Set all env vars in Vercel (do NOT commit `.env.local`):
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RESEND_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

### 8.4 Production Smoke Test
Once deployed, run Playwright against the live Vercel URL:
- [ ] Landing page loads
- [ ] Auth flow works end-to-end (signup → confirm → login)
- [ ] Core feature page loads and is accessible post-login
- [ ] No console errors on live URL

---

## PHASE 9 — HANDOFF

Output a clean summary:

```markdown
## [App Name] — Deployed

**Live URL:** https://[project-slug]-preview.vercel.app
**App URL:** https://[project-slug]-preview.vercel.app/app/dashboard
**Supabase Project:** [project URL]
**Resend Domain:** [domain]

## What's Built
- [Feature 1]: [one-line description]
- [Feature 2]: [one-line description]
- Auth: Email/password with confirmation flow
- Landing page: 7 sections, mobile-responsive

## Credentials (test account)
- Email: test@[domain].com
- Password: [generated]

## To Connect Your Domain
1. Add domain in Vercel dashboard
2. Update NEXT_PUBLIC_APP_URL env var
3. Add domain to Supabase allowed redirect URLs

## Next Steps (v2 candidates)
[List features deferred from scope]

## File Location
~/saas-projects/[project-slug]/
```

---

## QUALITY STANDARDS — NON-NEGOTIABLE

These apply to every SaaS built with this skill:

**Not AI slop means:**
- Real auth that actually works (not mocked, not fake)
- Real database with real RLS policies (not in-memory)
- Real email sending (not console.log)
- Error states on every form (not silent failures)
- Loading states on every async operation
- Empty states with CTAs (not blank white screens)
- TypeScript types everywhere (no `any`)
- Zero console errors in production

**Design standards (from frontend-theme):**
- Dark theme only (#060B08 base)
- Primary green (#0CBF6A) as sole accent
- Neue Haas Display body, Editor's Note display headings
- Layered radial green glows + noise texture on hero
- No default Tailwind blues/indigos anywhere
- Every clickable element: hover + focus-visible + active states

**Architecture standards:**
- Server components fetch data, client components handle interaction
- Mutations via Server Actions (not client-side fetch)
- Supabase RLS enforced at DB level, not just UI
- No business logic in UI components

---

## SKILLS USED BY THIS PIPELINE

| Phase | Skill/Tool |
|-------|-----------|
| Research | `research` skill + Agent tool (parallel) |
| UI components | Magic MCP (`@21st-dev/magic`) |
| Design system | `frontend-theme` skill |
| Design decisions | `ui-ux-pro-max` skill |
| DB migrations | `add-migration` skill |
| Testing | `mcp__playwright__*` tools |
| Deploy | Vercel CLI |
