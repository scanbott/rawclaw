---
owner: larry
domain: ops
last_reviewed: YYYY-MM-DD
status: active
---

# SOP: Sales Process

**Owner:** Larry (with [CEO_NAME] closing deals)
**Funnel:** [PRIMARY_LEAD_SOURCE] -> DM -> Discovery call -> Proposal -> Close -> Onboarding

## Lead Generation

### Primary Channel: [PRIMARY_LEAD_SOURCE]
- [CONTENT_STRATEGY_BRIEF]
- CTA: [PRIMARY_CTA]
- All leads route to [BOOKING_TOOL]

### Inbound DM Flow
1. Prospect comments on post or DMs
2. Larry (with [CEO_NAME] approval) responds within 24h
3. Qualify: Are they [ICP_DESCRIPTION]?
4. If qualified: book discovery call
5. If not: politely decline

## Discovery Call

### Pre-Call Prep (Larry prepares)
- Research prospect's business: revenue, team size, content, tools
- Identify top 3 AI integration points for their business
- Prepare proof relevant to their industry

### Call Structure (15-30 min)
1. Understand their current ops (10 min): "Walk me through how your business runs right now"
2. Identify the wall they're hitting: "Where does scale break down?"
3. Demo relevant parts of the dashboard
4. Qualify budget: "Do you have budget allocated for this?"
5. If qualified: send proposal within 24h

### Post-Call (Larry executes)
- Log call to Supabase `sales_calls` table
- Draft follow-up message for [CEO_NAME] approval
- Prepare customized proposal

## Proposal

### Contents
1. What we found in their business (3 specific observations)
2. What we'll build (specific to them, not generic)
3. Timeline: [BUILD_TURNAROUND] from payment
4. Investment: [INSTALL_PRICE] install + [RETAINER_PRICE]/mo (optional)
5. Next step: sign + pay to begin

### Approval
Larry drafts -> [CEO_NAME] reviews -> [CEO_NAME] sends

Never send a proposal without [CEO_NAME] explicitly approving it.

## Objection Handling

### "It's too expensive"
"What's your current cost of [PAIN_POINT] not being solved? Most clients see ROI in [ROI_TIMELINE]."

### "We need to think about it"
"What's the one thing that would need to be true for this to be a clear yes?"

### "We're not ready yet"
"What would ready look like? Let's figure out if we can help you get there."

### "We already tried AI"
"What did you try? Most people have tried [COMMON_WRONG_APPROACH]. This is different -- [KEY_DIFFERENTIATOR]."

## CRM Operations

All deals tracked in [CRM_TOOL].
Pipeline stages:
1. Lead (new contact, not yet qualified)
2. Discovery (call booked or completed)
3. Proposal (sent, waiting)
4. Negotiation (back and forth)
5. Closed Won (payment received)
6. Closed Lost (with reason)

Larry updates CRM within 24h of any status change.
