# /proposal Skill

Generate a full custom proposal for a Rawgrowth prospect. Gathers CRM data, call transcripts, and business research, then produces a personalized proposal page, draft email, and Slack approval request.

## Usage

```
/proposal Chance Mitchell
/proposal [lead name or context like "my last call"]
```

## Steps

### STEP 1 -- Identify the Lead

Search Close CRM for the lead by name.

```bash
curl -s -u "$CLOSE_API_KEY:" "https://api.close.com/api/v1/lead/?query=name:\"[NAME]\"" | jq '.data[0]'
```

- If "last call" or similar context is given, check Google Calendar (use the `google-calendar` skill) for the most recent completed meeting, then match the attendee name against Close CRM.
- Extract from the lead: `lead_id`, contact name (first + last), email, company, title, revenue, team size, industry, description, website URL, addresses, and any custom fields.
- Build the contact object:
  - `firstName` = first name from primary contact (fallback: "there")
  - `fullName` = first + last
  - `email` = primary email from contact
  - `revenue` = custom field "Annual Revenue" or "Revenue"
  - `teamSize` = custom field "Team Size" or "Headcount"
  - `industry` = custom field "Industry" or "Niche"

If no lead is found, report back and stop.

---

### STEP 2 -- Gather Intelligence (run all in parallel)

Run these three data-gathering steps concurrently.

#### Source A -- CRM Conversation History

Pull all activity from Close CRM for the lead_id. Use Basic auth: base64-encode `CLOSE_API_KEY:` (key + colon, empty password).

| Activity | Endpoint | Limit |
|----------|----------|-------|
| Emails | `GET /api/v1/activity/email/?lead_id={id}&_limit=50&_order_by=-date_created` | 50 |
| Calls | `GET /api/v1/activity/call/?lead_id={id}&_limit=20&_order_by=-date_created` | 20 |
| Notes | `GET /api/v1/activity/note/?lead_id={id}&_limit=30&_order_by=-date_created` | 30 |
| SMS | `GET /api/v1/activity/sms/?lead_id={id}&_limit=30&_order_by=-date_created` | 30 |

Format each activity type into labeled sections:

- **Emails:** `[SENT/RECEIVED YYYY-MM-DD] Subject: ... \n body (first 1000 chars)`
- **Calls:** `[OUTBOUND/INBOUND YYYY-MM-DD] duration | disposition \n Note: ...`
- **Notes:** `[YYYY-MM-DD] note text (first 800 chars, strip HTML)`
- **SMS:** `[SENT/RECEIVED YYYY-MM-DD] text`

If any activity type fails, continue without it.

#### Source B -- Call Transcript (Granola)

Fetch notes from Granola:

```
GET https://public-api.granola.ai/v1/notes
Authorization: Bearer $GRANOLA_API_KEY
```

Response may be an array or an object with a `notes` or `items` key. Handle all shapes.

Score each note against the prospect:
- Title contains full name or company name: +10
- Content/summary contains full name or company name: +5
- Participant name matches: +10

If best match scores > 0, fetch the full transcript:

```
GET https://public-api.granola.ai/v1/notes/{id}?include=transcript
Authorization: Bearer $GRANOLA_API_KEY
```

Use the `transcript` field (fallback to `content`).

If no match or Granola errors, continue without a transcript and flag it in the final report.

#### Source C -- Business Research

1. **Website scrape:** If the lead has a URL, fetch it with WebFetch. Strip scripts/styles/tags, keep first 4000 chars of text.
2. **AI research:** Call OpenRouter (`anthropic/claude-sonnet-4`) with this prompt:

```
Research this company and return a brief profile (max 500 words):

Company: {company}
Industry: {industry}
Revenue: {revenue}
Location: {addresses}
Website: {url}
Contact: {fullName}, {title}

Return:
1. What the company does (2-3 sentences)
2. Their likely pain points based on their industry and size
3. Key competitors
4. What AI automation would help them most
5. Any notable public info (funding, press, awards)

Be factual. If you don't know something, say so. Don't fabricate.
```

---

### STEP 3 -- Generate the Proposal

Call OpenRouter with model `anthropic/claude-sonnet-4`, max_tokens 4000.

**System context:** Rawgrowth brand voice. Short sentences, engineering vocabulary, peer-to-peer energy. No em dashes. Contractions always. No AI cliches.

**Prompt** (inject the gathered data into this template):

```
You are a proposal generator for Rawgrowth, a company that installs AI departments into businesses.

You have FOUR sources of intelligence about this prospect. Use ALL of them to create the most personalized, specific proposal possible.

=== PROSPECT INFO (from CRM) ===
- Name: {fullName}
- Title: {title}
- Company: {company}
- Industry: {industry}
- Revenue: {revenue}
- Team Size: {teamSize}
- Location: {addresses}
- Website: {url}
- CRM Description: {description}

=== DISCOVERY CALL TRANSCRIPT ===
{transcript or "(No transcript available. Use CRM data and business research instead.)"}

=== FULL CRM CONVERSATION HISTORY (emails, calls, notes, SMS) ===
{conversationHistory}

=== BUSINESS RESEARCH ===
{businessResearch}

Generate a JSON object with this exact structure. Output ONLY valid JSON, no markdown, no code fences.

CRITICAL: Reference SPECIFIC things from the call transcript and conversation history. If they mentioned a pain point, use their exact words. If they told you their team size or revenue, use those numbers. If they mentioned specific tools or processes, reference those.

Also generate a draft email that Chris will send with the proposal link. The email should:
- Be short, casual, peer-to-peer tone
- Reference something specific from the call
- Include a placeholder {{PROPOSAL_URL}} for the proposal link
- Mention the demo link: https://demo.rawgrowth.ai
- Include calendly.com/chriswestt/rawgrowth-discovery for booking a walkthrough
- Sign off as Chris
- No em dashes, contractions always, no AI cliches

{
  "narrative": {
    "heroHeadline": "2-line headline about installing AI into their specific business. Use their company name.",
    "heroSubheadline": "1-2 sentences about what changes. Reference their specific situation.",
    "painPoints": [
      { "pain": "Specific problem from the call or conversations", "severity": "high|medium|low", "proposedSolution": "How AI solves this specific problem" }
    ],
    "phases": [
      { "title": "Discovery", "description": "What we audit in their specific business", "deliverables": ["Specific deliverable 1", "Specific deliverable 2", "Specific deliverable 3"] },
      { "title": "Foundation", "description": "What systems we connect", "deliverables": ["...", "...", "..."] },
      { "title": "Activation", "description": "What agents we deploy", "deliverables": ["...", "...", "..."] },
      { "title": "Intelligence", "description": "The company LLM layer", "deliverables": ["...", "...", "..."] }
    ],
    "roiProjection": {
      "hoursSavedWeekly": 0,
      "revenueImpactMonthly": 0,
      "costReductionMonthly": 0,
      "paybackPeriodMonths": 0
    },
    "summary": "2-3 paragraphs summarizing the call and what we'd build. Reference specific things they said."
  },
  "emailDraft": {
    "subject": "Short email subject",
    "body": "The email body with {{PROPOSAL_URL}} placeholder and demo link https://demo.rawgrowth.ai"
  }
}

IMPORTANT RULES:
- ROI projection should be conservative and realistic.
- Use engineering vocabulary: install, deploy, build, plug in, productize, stack, source of truth.
- No em dashes. Contractions always. No AI cliches.
- The emailDraft must be casual, short, and reference something specific from the call.
- Do NOT generate dashboard data. All prospects see the generic demo at demo.rawgrowth.ai.
```

**Parse the response:** Strip any markdown code fences. Parse as JSON. If parsing fails, extract the first `{...}` block and retry.

---

### STEP 4 -- Save to Supabase

Generate the slug from the company name:
- Lowercase
- Replace non-alphanumeric characters with hyphens
- Strip leading/trailing hyphens

Insert into the `proposals` table:

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/proposals" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=minimal" \
  -d '{
    "slug": "{slug}",
    "lead_id": "{leadId}",
    "company": "{company}",
    "contact_name": "{firstName}",
    "contact_email": "{email}",
    "industry": "{industry}",
    "revenue": "{revenue}",
    "team_size": "{teamSize}",
    "narrative": {narrativeJSON},
    "dashboard_data": null,
    "status": "draft",
    "view_count": 0
  }'
```

If the write fails, report the error and stop.

---

### STEP 5 -- Post to Slack for Approval

Post to **#3-proposals** (channel ID: `C0ARK19CXPE`) using Slack Block Kit.

```bash
curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

Block structure:

1. **Header block:** `Proposal Ready: {company}`
2. **Section block (fields):**
   - Contact: `{fullName} ({email})`
   - Industry: `{industry}`
   - Revenue: `{revenue}`
   - Team: `{teamSize}`
3. **Divider**
4. **Section:** Proposal link: `proposal.rawgrowth.ai/{slug}`
5. **Section:** Demo link: `demo.rawgrowth.ai`
6. **Divider**
7. **Section:** Email preview (subject + body with `{{PROPOSAL_URL}}` replaced with actual URL)
8. **Divider**
9. **Actions block:** Two buttons:
    - **"Approve & Send"** (style: primary, action_id: `proposal_approve`)
      - value: JSON with `slug`, `leadId`, `email`, `firstName`, `company`, `subject`, `body` (with URL filled in)
    - **"Disapprove"** (style: danger, action_id: `proposal_disapprove`)
      - value: JSON with `slug`, `company`

Fallback text: `Proposal ready for {company}. Approve or disapprove.`

---

### STEP 6 -- Confirm

Report back with:

- **Proposal URL:** `proposal.rawgrowth.ai/{slug}`
- **Status:** Posted to #3-proposals for approval
- **Email draft preview:** Subject and body
- **Flags:** Note any missing data (no transcript found, missing email, missing revenue, etc.)

Remind: the email won't send until Chris approves in Slack.

---

## Follow-Up Sequence

After proposal approval, the 5-touch follow-up sequence activates (see `sales/scripts/proposal-follow-up-sequence.md`):

| Touch | Day | Purpose |
|-------|-----|---------|
| 1 | Day 0 | Proposal sent + Loom walkthrough |
| 2 | Day 2 | Targeted question based on objection profile |
| 3 | Day 5 | Case study + ROI math |
| 4 | Day 8 | Live demo offer |
| 5 | Day 12 | Final check -- close or archive |

Exit rule: any reply pulls them out into manual conversation.

---

## Important Rules

- All env vars come from `.env` at the project root.
- Close API uses Basic auth: base64-encode `CLOSE_API_KEY:` (key followed by colon, empty password).
- **Never send the email directly.** Always go through Slack approval first.
- `demo.rawgrowth.ai` is the demo link. All prospects see the same generic demo.
- Proposal pages live at `proposal.rawgrowth.ai/{slug}`.
- Booking link: `calendly.com/chriswestt/rawgrowth-discovery` (never cal.com).
- Pricing is custom per client. Minimum $15K. Never quote fixed rates in client-facing copy. Say "multi-five-figure investment" or "custom to your business."
- Brand voice: no em dashes, contractions always, engineering vocabulary, peer-to-peer energy.
- Banned words: game-changer, unlock, leverage, streamline, utilize, deep dive, certainly, revolutionary.
- Banned constructions: "Not X, it's Y", "Not theory, the actual...", parallel negation, stop/start swaps. Just state the thing directly.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CLOSE_API_KEY` | Close CRM API auth (used as Basic auth username) |
| `GRANOLA_API_KEY` | Granola call transcript API (Bearer token) |
| `OPENROUTER_API_KEY` | OpenRouter for AI generation (Bearer token) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SLACK_BOT_TOKEN` | Slack bot token for posting approval messages |
