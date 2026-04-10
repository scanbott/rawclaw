# Ship Check -- Mandatory E2E Quality Gate

**Trigger:** AUTOMATICALLY before ANY deployment, delivery, or "done" declaration. Every agent. No exceptions.

This is not optional. If you built it, you test it. If you can not test it, you do not ship it.

---

## When This Fires

This skill MUST run before:
- Any `vercel --prod` deploy
- Any "task complete" or "done" declaration
- Any ClickUp status move to "review" or "complete"
- Any deliverable sent to Chris, Dilan, or a client
- Any automation/workflow marked as ready
- Any tool, script, or pipeline declared working

## The Process

### Step 0: SKIP Detection (Fast Path)

Before running any E2E tests, check whether the changes have runtime impact.

```bash
git diff --stat HEAD~1
```

If ALL changed files match one of these patterns, emit **SKIP** and stop:
- `*.md` (documentation)
- `*.d.ts` (type declarations)
- `*.test.*` (test files)
- `*.spec.*` (spec files)
- `*.mdx` (documentation)
- `LICENSE`, `CHANGELOG*`, `.gitignore`, `.editorconfig`

**SKIP report format:**

```
SHIP CHECK REPORT
=================
Deliverable: [what was changed]
Tested at: [timestamp]

VERDICT: SKIP
Reason: All changed files are [docs-only / types-only / tests-only]. No runtime surface to verify.

Changed files:
- README.md
- docs/setup.md
```

**Rules for SKIP:**
- If even ONE file falls outside the skip patterns, run the full E2E suite. No partial skips.
- Tests in the diff are the author's evidence, not a verification surface. CI runs them.
- Mixed src + tests = verify the src, ignore the test files. Full E2E required.
- SKIP is not PASS. It means "nothing to test." Don't confuse the two.
- When in doubt, run the full check. SKIP is for obvious cases only.

If any file has runtime impact, proceed to Step 1.

### Step 1: Identify What Was Built

Categorize the deliverable:

| Type | Examples |
|------|----------|
| **Web app** | Dashboard, landing page, SaaS app, client portal |
| **API/endpoint** | REST routes, webhooks, serverless functions |
| **Automation** | n8n workflows, scheduled tasks, pipelines |
| **Script/tool** | CLI tools, Python scripts, bash utilities |
| **Content** | Copy, scripts, templates, documents |
| **Infrastructure** | Deployments, DNS, tunnels, Docker services |

### Step 2: Build the Test Plan

For each type, test EVERYTHING. Not a sample. Everything.

**Web apps -- test every route and interaction:**
1. Navigate to the live URL (not localhost)
2. Test the root path loads correctly (not a default template)
3. Test every navigation link and route
4. Test all forms: fill them, submit them, verify the result
5. Test auth flows end-to-end: signup, login, logout, protected routes
6. Test on mobile viewport (resize browser to 375px width)
7. Test error states: wrong password, empty fields, invalid input
8. Check console for errors (browser_console_messages)
9. Verify data actually persists (check the database after form submit)
10. Test every button, dropdown, modal, and interactive element

**APIs/endpoints -- test every method:**
1. Hit every endpoint with curl
2. Test with valid data, invalid data, missing data, and empty body
3. Verify response codes (200, 400, 401, 404, 500)
4. Verify response body structure matches what the frontend expects
5. Test auth: with token, without token, expired token
6. Test rate limits if applicable

**Automations/pipelines -- test the full chain:**
1. Trigger the automation with real (or realistic) input
2. Verify every step executed
3. Check the output matches expectations
4. Test failure paths: what happens when a step fails?
5. Verify logs/records were created

**Scripts/tools -- test all flags and modes:**
1. Run with --help or no args
2. Run with valid input
3. Run with invalid input
4. Run with edge cases (empty file, huge input, special characters)
5. Verify output format and content

**Content -- verify quality:**
1. Check against brand voice rubric (if brand-voice skill is loaded)
2. Verify no banned words or AI slop phrases
3. Check formatting renders correctly in the target medium
4. Verify all links work
5. Check for placeholder text or Lorem ipsum

### Step 3: Execute Tests Using Playwright

For web apps, use the Playwright MCP tools. This is non-negotiable.

```
1. browser_navigate to the live production URL
2. browser_snapshot to verify page structure
3. browser_click every link and button
4. browser_type into every form field
5. browser_console_messages to check for JS errors
6. browser_snapshot after each action to verify state changes
```

For APIs, use curl via Bash.
For scripts, run them via Bash.
For automations, trigger them and check results.

### Step 4: Document Results

Create a test report. Format:

```
SHIP CHECK REPORT
=================
Deliverable: [what was built]
URL/Location: [where it lives]
Tested at: [timestamp]

PASSED:
- [x] Root page loads correctly
- [x] Login form accepts credentials
- [x] Dashboard renders after auth
- [x] All 5 nav links route correctly
...

FAILED:
- [ ] Signup API returns 405 (middleware blocking /api/auth/*)
- [ ] Mobile viewport cuts off sidebar
...

VERDICT: SHIP / DO NOT SHIP / SKIP
```

### Step 5: Fix or Block

- If ALL tests pass: ship it, deploy it, mark it done.
- If ANY test fails: fix the issue, re-run the failing test, repeat until clean.
- If you can not fix it: DO NOT mark it done. Report the failure to Chris with the specific test that failed and why.
- If SKIP: no runtime surface exists. Log it and move on.

## Hard Rules

1. **No self-approval without testing.** "It compiled" is not a test. "The build passed" is not a test. You must interact with the live deployed version.
2. **Test production, not dev.** If it is a Vercel deploy, test the production URL. If it is a local tool, run it in the real environment.
3. **Console errors are failures.** If browser_console_messages shows errors, the test fails. Fix them.
4. **Default templates are failures.** If any page shows "To get started, edit page.tsx" or any framework default content, the test fails.
5. **Placeholder content is a failure.** "Lorem ipsum", "TODO", "placeholder_replace_me" in production = test failure.
6. **Every route gets visited.** Not "a few routes." Every single one.
7. **Every form gets submitted.** With valid data AND invalid data.
8. **Auth gets tested both ways.** Logged in AND logged out. Protected routes must redirect. Public routes must be accessible.

## Required Check Format (Non-Negotiable)

Every check in your report MUST follow this exact structure:

```
Check: [what you are verifying]
Command run: [exact command or Playwright action executed]
Output observed: [what actually came back]
Result: PASS / FAIL
```

**A check without a "Command run" field is not a PASS. It is a skip. Skips count as failures.**

Examples of invalid checks that will be rejected:
- "The login form looks correct" -- no command run
- "The API should return 200" -- assumption, not a test
- "I reviewed the code and it looks fine" -- reading is not verification
- "The build succeeded so this should work" -- build success is not runtime verification

## Self-Deception Catalog

You will be tempted to rationalize shortcuts. Recognize these excuses and reject them:

| Rationalization | Reality |
|---|---|
| "The code looks correct based on my reading" | Reading is not verification. Run it. |
| "The implementer's tests already pass" | The implementer is an LLM. Its tests may assert what the code does, not what it should do. Verify independently. |
| "I don't have browser access" | Did you actually check for mcp__playwright__browser_navigate in your tools? Try it before assuming. |
| "It worked in dev, so prod should be fine" | Test production. Not dev. |
| "This is a minor change, full testing is overkill" | Minor changes break things. That is why we test. |
| "I verified the logic by reading through it" | Logic review is not a test. Execute the code. |
| "The previous ship check passed so this is fine" | You changed something. Test what changed and its dependencies. |
| "PARTIAL -- I could not fully verify but it seems okay" | PARTIAL means you could not run the check at all, not that you ran it and it was ambiguous. If you cannot run it, mark FAIL and explain why. |

If you catch yourself writing any of these, stop. Run the actual command. Get the actual output. Record both.

## Integration With Agent Workflow

All agents must treat this as a mandatory final step. The workflow is:

```
Build -> Local test -> Deploy -> SHIP CHECK -> Mark done
```

Never:
```
Build -> Deploy -> Mark done
```

If an agent marks something as done without running ship-check, that is a process failure. Call it out.
