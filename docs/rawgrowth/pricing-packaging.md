# Raw Claw -- Pricing & Packaging

**Version:** 1.0 | **Date:** 2026-03-30
**Audience:** Internal (Chris, Dilan, Alexander)
**Reference client:** Dineline ($7K setup + $4K/mo for 3 seats -- early-adopter pricing)

---

## Package Tiers

### Tier 1: Starter -- $5,000 setup + $3,000/month

**Best for:** Solo operators or small teams (1-5 people) who want one power-user seat.

| Included | Details |
|----------|---------|
| Seats | 1 |
| Hardware | 1 Mac Mini (client purchases or we source) |
| Agent roles | CEO-level (full access) |
| Integrations | CRM (HubSpot/GHL) + 1 ad platform + Slack/Discord + Dashboard |
| Database | Shared Supabase project, single-tenant schema |
| Monitoring | Heartbeat + alerts to Discord/Slack |
| Scheduled tasks | 2 automated workflows (daily scorecard + weekly report) |
| Training | 60-min onboarding session |
| Support | Slack-based, next-business-day response |
| Remote access | Tailscale VPN |

**Not included:** Multiple ad platforms, Stripe integration, custom integrations, priority support.

**Upgrade path:** Add seats at $1,500/mo each. Upgrade to Growth at any time (credit setup fee difference).

---

### Tier 2: Growth -- $10,000 setup + $5,000/month

**Best for:** Teams of 5-15 with multiple departments that need AI coverage. This is the standard package.

| Included | Details |
|----------|---------|
| Seats | 3 |
| Hardware | 3 Mac Minis (client purchases) |
| Agent roles | CEO + COO + Technical (configurable per seat) |
| Integrations | CRM + 2 ad platforms + PM tool + Slack/Discord + Stripe (read-only) + Dashboard |
| Database | Dedicated Supabase project, RLS per seat |
| Monitoring | Heartbeat + alerts + uptime reporting |
| Scheduled tasks | 5 automated workflows |
| Training | 90-min team onboarding + per-seat Getting Started guides |
| Support | Slack-based, same-day response |
| Remote access | Tailscale VPN + Cloudflare Tunnel for dashboards |
| Content engine | 30+ pieces/week capability per content-assigned seat |

**Not included:** Custom integrations, phone support, on-site visits after install.

**Dineline reference:** Dineline paid $7K setup + $4K/mo (early-adopter discount). Growth tier is the productized version at full price.

---

### Tier 3: Enterprise -- $20,000 setup + $8,000/month

**Best for:** Companies with 15+ employees, complex tech stacks, compliance requirements, or 5+ seats.

| Included | Details |
|----------|---------|
| Seats | 5 (additional seats at $1,000/mo each) |
| Hardware | 5 Mac Minis |
| Agent roles | Full role hierarchy (CEO, COO, Technical, Employee) |
| Integrations | Unlimited standard integrations + 2 custom integrations |
| Database | Dedicated Supabase project, full RLS + audit logging |
| Monitoring | Heartbeat + alerts + uptime + API health checks + weekly health digest |
| Scheduled tasks | Unlimited automated workflows |
| Training | Half-day onboarding workshop + per-seat guides + video walkthroughs |
| Support | Slack + phone, 2-hour response SLA |
| Remote access | Tailscale + Cloudflare Tunnel + dedicated monitoring dashboard |
| Content engine | Full 60+ pieces/week capability |
| Quarterly review | QBR with Chris + Alexander |
| Custom CLAUDE.md | Fully tailored agent personalities per seat |

**Not included:** On-site support beyond install day (available as add-on).

---

## Add-Ons

| Add-On | One-Time | Monthly | Notes |
|--------|----------|---------|-------|
| Additional seat (Growth) | -- | $1,500/mo | Includes setup + CLAUDE.md + monitoring |
| Additional seat (Enterprise) | -- | $1,000/mo | Volume discount |
| Custom integration | $2,000-5,000 | -- | Depends on API complexity; scoped per client |
| On-site visit (non-install) | $3,000 + travel | -- | Chris flies out for training or troubleshooting |
| Training session (additional) | $500 | -- | 60-min session for new team members |
| Content engine upgrade | $1,000 | $500/mo | Add content generation to a non-content seat |
| White-label dashboard | $3,000 | -- | Custom branding on the monitoring dashboard |
| Priority support upgrade | -- | $1,000/mo | Upgrades to 1-hour SLA + phone |
| Data migration | $1,000-3,000 | -- | Migrate from existing tools to Raw Claw schema |

---

## Pricing Comparison (for sales conversations)

| Cost Category | Traditional Hiring | Raw Claw (Growth) |
|--------------|-------------------|-------------------|
| Content manager + copywriter | $80-120K/year | Included |
| Sales ops coordinator | $70-100K/year | Included |
| Data/reporting analyst | $80-120K/year | Included |
| Ops coordinator / VA | $50-70K/year | Included |
| **Total annual cost** | **$280-410K/year** | **$70K/year** ($10K setup + $5K x 12) |
| Time to hire | 2-4 months | 2-3 weeks |
| Ramp time | 3-6 months | Day 1 output |
| Turnover risk | High | None |
| Scales with growth | Linear (more people = more cost) | Flat (same monthly, more capable) |

**ROI payback period:** 30-60 days at Growth tier.

---

## Cost Structure -- What It Actually Costs Us

### Per-Client Fixed Costs

| Item | Cost | Who Pays |
|------|------|----------|
| Anthropic API (Claude) | ~$200-500/mo per seat at moderate usage | Us (included in monthly) |
| Supabase (Pro plan) | $25/mo per project | Us (included in monthly) |
| Tailscale (Business) | $0-18/mo per user (free tier covers most) | Us |
| Cloudflare (Free/Pro) | $0-20/mo | Us |
| Mac Mini hardware | $599-1,599 each (M4/M4 Pro) | Client purchases |
| Trigger.dev (Pro) | $0-50/mo (usage-based) | Us |

### Per-Client Variable Costs

| Item | Estimate | Notes |
|------|----------|-------|
| Alexander setup time (Starter) | 8-12 hours | Scaffold, configure, test, deploy |
| Alexander setup time (Growth) | 15-25 hours | 3 seats, more integrations, RLS |
| Alexander setup time (Enterprise) | 25-40 hours | 5+ seats, custom integrations, compliance |
| Chris install day (on-site) | 4-8 hours + travel | Travel expensed to client or absorbed |
| Dilan onboarding + coordination | 5-10 hours per client | Intake, key collection, Week 1 check-ins |
| Alexander monthly maintenance | 2-4 hours/mo per client | Monitoring, updates, bug fixes |
| Dilan monthly management | 2-3 hours/mo per client | Check-ins, support tickets |

### Margin Analysis

| Package | Setup Revenue | Setup Cost (labor) | Monthly Revenue | Monthly Cost | Monthly Margin |
|---------|--------------|-------------------|-----------------|-------------|---------------|
| Starter | $5,000 | ~$2,000 (12h x ~$165) | $3,000 | ~$800 | ~$2,200 (73%) |
| Growth | $10,000 | ~$4,000 (25h x ~$165) | $5,000 | ~$1,500 | ~$3,500 (70%) |
| Enterprise | $20,000 | ~$6,500 (40h x ~$165) | $8,000 | ~$2,500 | ~$5,500 (69%) |

**Hourly rate assumption:** Alexander's time valued at ~$165/hr (opportunity cost).

**Break-even per client:** Month 1 (setup fee covers setup labor + first month).

**Key insight:** Monthly margins are strong (69-73%) because most of the ongoing work is automated. Alexander's time per client drops significantly after install. The business scales by adding clients, not headcount.

---

## Discounts & Special Pricing

| Scenario | Discount | Approval |
|----------|----------|----------|
| Annual prepay (12 months upfront) | 10% off monthly | Chris approves |
| Referral (client refers another client) | $1,000 credit or 1 month free | Automatic |
| Case study participant | $500/mo discount for 3 months | Chris approves |
| Early adopter (first 10 clients) | Up to 30% off setup | Chris + Alexander approve |
| Multi-location (same company, 2+ locations) | 15% off monthly per additional location | Chris approves |

**Never discount below these floors:**
- Starter: $3,000 setup / $2,000/mo
- Growth: $7,000 setup / $3,500/mo
- Enterprise: $15,000 setup / $6,000/mo

---

## Payment Terms

- **Setup fee:** Due before install day begins. Net-0 (payment received = install scheduled).
- **Monthly fee:** Billed on the 1st of each month. Due within 7 days.
- **Payment methods:** Wire transfer, ACH, Stripe invoice (no crypto, no checks).
- **Late payment:** 7-day grace period. After 14 days late, agents are paused (not deleted). After 30 days, agents are decommissioned. Client keeps all files/data.
- **Cancellation:** 30-day written notice. No refund on current month. Client retains all code, agents, data, and documentation.

---

## Contract Terms

**Key terms to include in every agreement:**

1. Client owns all code, agents, data, and documentation installed on their hardware
2. No lock-in -- cancel anytime with 30 days notice
3. Raw Growth retains the right to use anonymized metrics for case studies (with client approval)
4. API costs (Anthropic, etc.) are included in the monthly fee up to reasonable usage. Excessive usage (>$2,000/mo API spend per seat) requires a conversation
5. Hardware is purchased and owned by the client
6. Raw Growth is not liable for AI-generated output that the client publishes without review
7. Data processing agreement (DPA) available upon request for GDPR/SOC2 clients

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-30 | Initial release based on Dineline deployment learnings |

*Raw Claw Pricing & Packaging v1.0*
