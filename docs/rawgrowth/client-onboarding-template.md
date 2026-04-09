# Raw Claw -- Client Onboarding Template

**Version:** 1.0 | **Date:** 2026-03-30
**Instructions:** Copy this file to `rawclaw/clients/{slug}/onboarding.md` and fill in all fields.

---

## Client Overview

| Field | Value |
|-------|-------|
| Company name | |
| Slug (internal) | |
| Website | |
| Industry | |
| Annual revenue | |
| Package | Starter / Growth / Enterprise |
| Setup fee | $ |
| Monthly fee | $ |
| Signed date | |
| Target install date | |
| Sales lead | Chris / Dilan |
| Technical lead | Alexander |

---

## Team & Seat Assignments

### Seat 1

| Field | Value |
|-------|-------|
| Name | |
| Email | |
| Phone / WhatsApp | |
| Job title | |
| AI role | CEO / COO / Technical / Employee |
| Mac Mini location | |
| Primary responsibilities | |
| Quick win for this seat | |
| Technical comfort | Beginner / Intermediate / Advanced |

### Seat 2

| Field | Value |
|-------|-------|
| Name | |
| Email | |
| Phone / WhatsApp | |
| Job title | |
| AI role | CEO / COO / Technical / Employee |
| Mac Mini location | |
| Primary responsibilities | |
| Quick win for this seat | |
| Technical comfort | Beginner / Intermediate / Advanced |

### Seat 3

| Field | Value |
|-------|-------|
| Name | |
| Email | |
| Phone / WhatsApp | |
| Job title | |
| AI role | CEO / COO / Technical / Employee |
| Mac Mini location | |
| Primary responsibilities | |
| Quick win for this seat | |
| Technical comfort | Beginner / Intermediate / Advanced |

> Copy and add Seat 4, 5, etc. for Enterprise packages.

### Client POC (Primary Contact)

| Field | Value |
|-------|-------|
| Name | |
| Title | |
| Email | |
| Phone | |
| Best time to reach | |
| Backup contact (name + phone) | |

### IT Contact

| Field | Value |
|-------|-------|
| Name | |
| Email | |
| Phone | |
| Managed IT provider (if external) | |
| Can make firewall / DNS changes? | Yes / No |

---

## Integration Checklist

Check each integration needed for this client. Mark key status as collected/tested.

| Integration | Needed? | API Key Collected? | API Key Tested? | Notes |
|-------------|---------|-------------------|-----------------|-------|
| **Core (we provide)** | | | | |
| Anthropic (Claude) | Yes | [ ] | [ ] | `ANTHROPIC_API_KEY` |
| Supabase | Yes | [ ] | [ ] | URL + service key + anon key |
| Tailscale | Yes | [ ] | [ ] | Auth key generated |
| **CRM** | | | | |
| HubSpot | Y / N | [ ] | [ ] | API key + portal ID |
| Salesforce | Y / N | [ ] | [ ] | OAuth credentials |
| GoHighLevel | Y / N | [ ] | [ ] | Location key + agency token |
| Close CRM | Y / N | [ ] | [ ] | API key |
| **Ad Platforms** | | | | |
| Meta Ads | Y / N | [ ] | [ ] | Access token + app ID + secret + ad account ID |
| Google Ads | Y / N | [ ] | [ ] | Dev token + OAuth + customer ID |
| TikTok Ads | Y / N | [ ] | [ ] | API key |
| **Payments** | | | | |
| Stripe | Y / N | [ ] | [ ] | Restricted key (read-only) |
| **Project Management** | | | | |
| ClickUp | Y / N | [ ] | [ ] | Personal API token |
| Asana | Y / N | [ ] | [ ] | Personal access token |
| Notion | Y / N | [ ] | [ ] | Internal integration key |
| **Communication** | | | | |
| Slack | Y / N | [ ] | [ ] | Bot token + app token + signing secret |
| Discord | Y / N | [ ] | [ ] | Webhook URLs (alerts + heartbeat) |
| **Other** | | | | |
| Google Workspace | Y / N | [ ] | [ ] | |
| Google Analytics | Y / N | [ ] | [ ] | Service account JSON |
| Custom: ___ | Y / N | [ ] | [ ] | |
| Custom: ___ | Y / N | [ ] | [ ] | |

**Credential transfer method:** 1Password / Slack DM / USB / Other: ___

---

## Hardware & Network

| Field | Seat 1 | Seat 2 | Seat 3 |
|-------|--------|--------|--------|
| Mac Mini model | | | |
| RAM | | | |
| Storage | | | |
| Serial number | | | |
| Ethernet or Wi-Fi | | | |
| Local IP / Tailscale IP | | | |

| Network Field | Value |
|---------------|-------|
| ISP | |
| Speed (down/up) | |
| Static IP? | Y / N |
| Firewall in place? | Y / N |
| Outbound ports open (443, 80, 22, 5432, UDP)? | Y / N |
| VPN on network? | Y / N |

---

## Timeline & Milestones

| Milestone | Target Date | Status | Owner |
|-----------|-------------|--------|-------|
| Agreement signed | | [ ] Done | Chris/Dilan |
| Intake form completed | | [ ] Done | Dilan |
| API keys collected | | [ ] Done | Dilan |
| API keys tested | | [ ] Done | Alexander |
| Mac Minis on-site | | [ ] Done | Client |
| Supabase project created | | [ ] Done | Alexander |
| .env files generated | | [ ] Done | Alexander |
| CLAUDE.md templates populated | | [ ] Done | Alexander |
| Pre-install checklist passed | | [ ] Done | Dilan + Alexander |
| Install day | | [ ] Done | Chris + Alexander |
| Week 1 check-in | | [ ] Done | Dilan |
| Week 2 check-in | | [ ] Done | Dilan |
| Month 1 review | | [ ] Done | Dilan + Chris |

---

## Success Criteria

**What does "worth the monthly fee" look like for this client?**

> [Fill in from intake conversation -- be specific. E.g., "Saves Brett 10+ hours/week on reporting, daily scorecard replaces Monday ops meeting, all leads followed up within 4 hours"]

### Quick Wins (must be delivered on install day)

| # | Quick Win | Seat | How to Demonstrate | Delivered? |
|---|-----------|------|--------------------|------------|
| 1 | | | | [ ] |
| 2 | | | | [ ] |
| 3 | | | | [ ] |

### 30-Day Success Metrics

| Metric | Baseline (before install) | Target (30 days) | Actual |
|--------|--------------------------|-------------------|--------|
| Hours saved per week | | | |
| Reports generated automatically | 0 | | |
| Content pieces per week | | | |
| Lead follow-up time | | | |
| Custom: ___ | | | |

---

## Compliance & Security Notes

| Question | Answer |
|----------|--------|
| Data types handled | PII / Financial / Health / General business |
| Regulations that apply | GDPR / CCPA / HIPAA / SOC2 / None / Other: ___ |
| Data can be sent to Anthropic API? | Yes / Yes with restrictions / No |
| Supabase region preference | us-east-1 / eu-west-1 / Other: ___ |
| AI-generated content must be labeled? | Yes / No |
| Content approval required before publishing? | Yes / No |
| DPA (Data Processing Agreement) needed? | Yes / No |
| Acceptable use policy reviewed? | [ ] Yes -- date: ___ |

---

## Post-Install Review Templates

### Week 1 Review

```
WEEK 1 REVIEW: {Company Name}
Date: ___
Attendees: ___

WINS:
-

ISSUES:
-

QUICK WIN STATUS:
1. [Delivered / In Progress / Blocked]
2. [Delivered / In Progress / Blocked]
3. [Delivered / In Progress / Blocked]

AGENT HEALTH:
- Uptime: ___%
- Interactions per seat: ___
- Scheduled tasks running: Y / N

SEAT HOLDER FEEDBACK:
- Seat 1 ({name}): comfort level __/5, feedback: ___
- Seat 2 ({name}): comfort level __/5, feedback: ___
- Seat 3 ({name}): comfort level __/5, feedback: ___

ACTION ITEMS:
1.
2.
3.

NEXT CHECK-IN: ___
```

### Week 2 Review

```
WEEK 2 REVIEW: {Company Name}
Date: ___

PROGRESS SINCE WEEK 1:
-

NEW REQUESTS:
-

USAGE TRENDS:
- Most active seat: ___
- Least active seat: ___ (reason: ___)
- Total agent interactions this week: ___

ISSUES RESOLVED:
-

OPEN ISSUES:
-

ACTION ITEMS:
1.
2.

NEXT REVIEW: Month 1 (___)
```

### Month 1 Review

```
MONTH 1 REVIEW: {Company Name}
Date: ___
Attendees: ___ (include Chris for Month 1)

EXECUTIVE SUMMARY:
- Hours saved this month: ___
- Reports generated: ___
- Content pieces produced: ___
- Estimated value delivered: $___

ROI CALCULATION:
- Monthly fee: $___
- Estimated labor hours replaced: ___ hrs x $___ /hr = $___
- Net ROI: $___
- Payback achieved? Y / N (if not, ETA: ___)

SATISFACTION:
- Client satisfaction score (1-10): ___
- "What would make this a 9 or 10?": ___

WHAT'S WORKING:
1.
2.
3.

WHAT NEEDS IMPROVEMENT:
1.
2.

EXPANSION OPPORTUNITIES:
- Additional seats needed? ___
- New integrations requested? ___
- New automations identified? ___

NEXT STEPS:
1.
2.
3.

NEXT REVIEW: Month 2 (___)
```

### Monthly Review (Months 2+)

```
MONTHLY REVIEW: {Company Name}
Month: ___ | Date: ___

METRICS:
- Agent uptime: ___%
- Hours saved: ___
- Tasks automated per week: ___
- Support tickets this month: ___

WINS:
-

ISSUES:
-

CLIENT SATISFACTION (1-10): ___

RENEWAL RISK: Low / Medium / High
If Medium/High, reason: ___

ACTION ITEMS:
1.
2.

NEXT REVIEW: ___
```

---

## Notes

> Use this section for any client-specific context, special requirements, or decisions made during onboarding.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-30 | Initial template |

*Raw Claw Client Onboarding Template v1.0*
