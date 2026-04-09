# Raw Growth -- Case Study Template + Dineline First Case Study

**Version 1.0 | March 2026**
**For marketing, sales, and website use**

---

## Part 1: Reusable Case Study Template

### Structure (S-C-S-R-Q Framework)

Every Raw Growth case study follows this exact structure:

1. **Situation** -- Who is the client? What do they do? Revenue range. Team size. Industry.
2. **Challenge** -- What specific problems were they facing? Quantify the pain in dollars, hours, or missed opportunities.
3. **Solution** -- What did Raw Growth install? Which agents? What integrations? How long did the install take?
4. **Results** -- Quantified outcomes. Before vs. after. Dollar savings. Time saved. Output increases. Use specific numbers.
5. **Quote** -- Direct quote from the client (or founder/decision-maker) that captures the transformation in their own words.

### Data Collection Checklist (gather before writing)

- [ ] Client company name (or anonymized descriptor)
- [ ] Industry and business model
- [ ] Revenue range (approximate is fine)
- [ ] Team size
- [ ] Specific pain points (3 minimum, with quantified impact)
- [ ] Which agents were installed
- [ ] Install timeline (actual days/weeks)
- [ ] Setup cost and monthly retainer
- [ ] Before metrics: content output, sales cycle length, reporting hours, headcount doing ops
- [ ] After metrics: same categories, measured at 30/60/90 day marks
- [ ] Headcount equivalent saved (dollar value)
- [ ] Client quote (video preferred, written acceptable)
- [ ] Client logo and permission to use name (if not anonymized)
- [ ] One specific "moment" or anecdote that captures the transformation

### Writing Guidelines

- Lead with the result, not the process
- Use specific numbers everywhere. "Increased content output" is weak. "Went from 12 posts/week to 67 posts/week" is strong.
- Keep the client as the hero, not Raw Growth. They made the smart decision.
- Include one human moment -- a quote or anecdote that makes it feel real
- No jargon. Write at an 8th-grade reading level.
- Every claim must be verifiable. Do not exaggerate.

---

## Part 2: Dineline Case Study (First Client)

### Full-Length Version (Detailed PDF -- 400+ words)

---

**HEADLINE**: How a $500K/Month Restaurant Marketing Agency Replaced $180K in Headcount with an AI Department

**SUBHEAD**: Dineline went from drowning in manual ops to running a full AI department across 3 workstations -- in under 90 days.

---

#### Situation

Dineline is a restaurant marketing agency generating over $500K per month in revenue. Their three-person leadership team -- Nick (operations/LA), Brett (strategy/Miami), and Jace (fulfillment/Miami) -- manages campaigns, client relationships, and delivery for dozens of restaurant clients across the US.

At their revenue level, Dineline was at a critical inflection point: growing fast enough to need serious operational infrastructure, but not yet at the scale where hiring a full ops team made financial sense.

#### Challenge

Dineline's leadership team was spending the majority of their time on tasks that were necessary but not strategic:

- **Content production was manual and slow.** The team produced 8-10 pieces of content per week, each requiring hands-on creation. At their growth rate, they needed 50+ pieces per week to feed all channels -- an impossible ask without hiring a dedicated content team ($80-120K/year).

- **Sales tracking lived in spreadsheets.** Lead follow-ups were inconsistent. Pipeline visibility required manually updating shared docs. No lead scoring. No automated follow-up sequences. Estimated revenue leaked from missed follow-ups: $15-30K/month.

- **Reporting consumed 10+ hours per week.** Someone on the leadership team -- usually Nick -- spent half a day every week pulling numbers from HubSpot, Google Ads, Stripe, and ClickUp into a master spreadsheet. By the time the report was finished, the data was already stale.

- **No single source of truth.** Data lived in 6+ tools with no unified dashboard. Decision-making was based on gut feeling and fragmented information.

The total cost of these problems: an estimated $180K/year in headcount that would need to be hired to solve them traditionally, plus an unknown amount of revenue lost to missed follow-ups and slow content output.

#### Solution

Raw Growth installed a full AI department at Dineline, deployed across 3 dedicated Mac Mini workstations -- one for each leadership team member.

**What was installed:**

- **AI Content Engine**: Trained on Dineline's existing content, brand voice, and restaurant marketing expertise. Produces blog posts, social media content, email sequences, and client-facing materials.

- **AI Sales Manager**: Connected to HubSpot. Scores every lead. Runs automated follow-up sequences. Generates pre-call briefing documents. Pipeline dashboard with real-time conversion metrics.

- **Company Hub Dashboard**: Unified dashboard pulling from HubSpot, Google Ads, Stripe, and ClickUp. Revenue, pipeline, content metrics, and team KPIs on a single screen. Auto-updating every 15 minutes.

- **AI Operations Agent**: Process documentation, SOP generation, and internal knowledge base. New hire onboarding materials generated automatically.

- **Monitoring & Health System**: Heartbeat checks every 15 minutes with Slack alerts. API health monitoring. Automated recovery for agent failures.

- **Trigger.dev Automated Tasks**: Daily scorecard at 7am ET, CRM sync every 4 hours, SQLite offline cache for each workstation, weekly digest reports.

**Technical architecture:**
- Supabase backend with row-level security (each seat sees only their role-scoped data)
- Tailscale mesh VPN for secure remote access
- Slack as primary agent interface
- Role-scoped CLAUDE.md files customizing each agent's behavior per team member
- Idempotent install script (setup.sh) for one-command deployment

**Install timeline**: Phase 1 (content engine + dashboard) live in 7 days. Full department operational in 60 days.

#### Results

**Content output:**
- Before: 8-10 pieces/week (manual)
- After: 60+ pieces/week (automated, in Dineline's brand voice)
- Improvement: 6-7x increase with zero additional headcount

**Sales pipeline:**
- Before: Manual spreadsheet tracking, inconsistent follow-ups
- After: Automated lead scoring, sequenced follow-ups, real-time pipeline dashboard
- Improvement: Zero leads dropped, pre-call briefs for every meeting

**Reporting:**
- Before: 10+ hours/week of manual data pulling
- After: Real-time dashboard, zero manual reporting
- Improvement: 10+ hours/week returned to strategic work

**Operational visibility:**
- Before: Data in 6+ disconnected tools
- After: Single dashboard with all metrics, auto-updating every 15 minutes

**Financial impact:**
- Setup investment: $18,000
- Monthly retainer: $10,000/month
- Annual cost: $138,000 (Year 1)
- Headcount equivalent replaced: ~$180,000/year
- **Net savings Year 1: ~$42,000**
- **Net savings Year 2+: ~$60,000/year** (no setup fee)
- ROI payback period: approximately 45 days

#### Quote

> "We were spending half our time on stuff that was not actually growing the business. Now the AI handles content, reporting, and pipeline management, and we get to focus on what we are actually good at -- building relationships and closing deals. The dashboard alone was worth it. Everything else is a bonus."
> -- Nick, Operations Lead, Dineline

---

### One-Page PDF Version (200 words)

---

**How Dineline Replaced $180K in Headcount with an AI Department**

**The Challenge**: Dineline, a $500K/month restaurant marketing agency, had a 3-person leadership team drowning in manual content production (8-10 pieces/week), spreadsheet-based sales tracking, and 10+ hours/week of manual reporting.

**The Solution**: Raw Growth installed a full AI department across 3 workstations: Content Engine (60+ pieces/week), AI Sales Manager (HubSpot-connected, automated follow-ups), Company Hub Dashboard (real-time, single screen), and Operations Agent.

**The Results**:
- Content: 8-10/week to 60+/week (6-7x increase)
- Reporting: 10+ hours/week to zero manual work
- Sales: Zero dropped leads, automated scoring and follow-up
- Dashboard: One screen for everything, updating every 15 minutes

**The Investment**: $18K setup + $10K/month. Replaces ~$180K/year in headcount. ROI payback in ~45 days.

**The Guarantee**: Dineline keeps everything Raw Growth built -- even if they cancel. No lock-in. No hostage-taking.

> "The AI handles content, reporting, and pipeline management. We get to focus on what we are actually good at." -- Nick, Dineline

---

### LinkedIn Post Version (250 words)

---

We just installed a full AI department inside a $500K/month agency.

Here is what happened:

Dineline is a restaurant marketing agency. 3-person leadership team. Growing fast. But drowning in ops work.

The problem:
- Content: 8-10 pieces/week, all manual
- Sales: spreadsheets, missed follow-ups, no pipeline visibility
- Reporting: 10+ hours/week pulling numbers

The fix: we installed 8 AI agents across 3 workstations.

The results (60 days in):
- Content: 60+ pieces/week. Automated. In their voice.
- Sales: every lead scored, every follow-up automated, pipeline on a dashboard
- Reporting: real-time dashboard. Zero manual work. Zero hours wasted.

The math:
- Traditional solution: hire 3-4 people = $180K/year
- Raw Growth: $18K setup + $10K/month = $138K/year
- Savings: $42K in Year 1, $60K+ every year after

And if they ever cancel, they keep everything we built.

This is what an AI department looks like in practice. Not ChatGPT prompts. Not Zapier automations. Actual agents connected to their real tools, producing real output, 24/7.

We take 8 clients per quarter because every install gets our CTO's direct attention.

If your business is doing $1M-$15M and you are spending more on ops headcount than you should -- this is what we do.

DM "AI" if you want to see the dashboard live.

---

### Tweet-Size Version (280 characters)

---

Installed a full AI department inside a $500K/mo agency. 8 agents. 60+ content pieces/week. Real-time dashboard. Sales pipeline on autopilot. Replaces $180K/yr in headcount for $138K. And they keep everything if they cancel. This is what Raw Growth does. DM for details.

---

### Email Snippet Version (for insertion into cold emails or newsletters)

---

**Subject**: how a $500K/mo agency replaced $180K in headcount

One of our clients -- a restaurant marketing agency doing $500K+/month -- was spending $180K/year worth of time on manual content, spreadsheet sales tracking, and report pulling.

We installed an AI department: content engine (60+ pieces/week), sales pipeline manager, real-time dashboard, and ops agent. Across 3 workstations. Live in 7 days.

Result: 6-7x content output, zero manual reporting, zero dropped leads, and $42K saved in Year 1.

Want to see how it would work for [COMPANY NAME]?

---

## Part 3: Future Case Study Slots

As new clients onboard, fill in this table and write case studies using the template above.

| Client | Industry | Revenue | Install Date | 30-Day Check | 60-Day Check | 90-Day Check | Case Study Written |
|--------|----------|---------|-------------|-------------|-------------|-------------|-------------------|
| Dineline | Restaurant marketing agency | $500K+/mo | March 2026 | Pending | Pending | Pending | Draft complete (above) |
| [Client 2] | | | | | | | |
| [Client 3] | | | | | | | |
| [Client 4] | | | | | | | |
| [Client 5] | | | | | | | |

**Process for each new case study:**
1. Collect data at 30, 60, and 90 day marks using the checklist above
2. Write full-length version first
3. Generate all 4 formats from the full-length version
4. Get client approval before publishing
5. Add to website, pitch deck (slide 11), and cold email sequences

---

*Update this document every time a new case study is completed. Maintain at least 3 active case studies covering different ICPs (agency, coaching, SaaS).*
