---
owner: cleo
domain: ops
last_reviewed: YYYY-MM-DD
status: active
---

# SOP: Client Onboarding

**Owner:** Cleo (with [COO_NAME] managing client relationship)
**Trigger:** New client signs contract and pays install fee
**Timeline:** [BUILD_TURNAROUND] from payment to live system

## Phase 1: Discovery (Days 1-2)

### 1.1 Send Brand Intake Form
- Send [INTAKE_FORM_LINK] within 1 hour of payment
- Notify [COO_NAME] that form has been sent
- Follow up at 24h if not completed

### 1.2 Kick-off Call
- Schedule within 48h of payment
- Attendees: [CEO_NAME] (or [COO_NAME]), client
- Agenda: Confirm deliverables, access needs, timeline

### 1.3 Access Collection
Collect via secure form:
- [ ] CRM access ([CRM_TOOL])
- [ ] Email account access
- [ ] Social media account access
- [ ] Analytics access (GA4, platform analytics)
- [ ] Existing docs/SOPs
- [ ] Slack workspace invite

## Phase 2: Audit (Days 2-4)

### 2.1 Business Audit
Ovi runs the full audit:
- All employees + what they do
- All tools in current stack
- All active workflows
- Revenue by channel
- Content performance metrics

### 2.2 AI Opportunity Map
[COO_NAME] reviews audit and creates delivery blueprint:
- Top 3 AI integration points
- Agent architecture for this client
- Dashboard data sources
- Timeline milestones

Deliver blueprint to Ali within 24h of audit completion.

## Phase 3: Build (Days 4-6)

Ali executes the delivery blueprint:
- [ ] Supabase project created and configured
- [ ] Agents deployed and tested
- [ ] Dashboard built and populated with client data
- [ ] Integrations connected and verified
- [ ] All API keys stored securely (never in files)

Ali notifies [COO_NAME] before any client-visible deployment.

## Phase 4: Handoff (Day 7)

### 4.1 Training Call
- Attendees: [CEO_NAME] or [COO_NAME], client + their team
- Walk through dashboard
- Show agents in action
- Document any questions

### 4.2 Onboarding Complete
- [ ] Client confirms system is live
- [ ] Access credentials transferred to client
- [ ] First monthly check-in scheduled
- [ ] Update Supabase `clients` table to `active`
- [ ] Log to hive_mind

## Ongoing: Monthly Retainer

### Monthly Check-in (if applicable)
- Review dashboard metrics
- Identify optimization opportunities
- Report ROI against baseline
- Queue next month's priorities

### Health Monitoring
Cleo monitors weekly:
- Client engagement with dashboard
- Any support requests
- [COO_NAME] flags any relationship concerns

## Escalation
If client is unresponsive for 3+ days: notify [COO_NAME] immediately.
If technical blocker delays timeline: Ali notifies [COO_NAME] within 2h.
