---
name: ship-check
description: Pre-delivery quality gate. Run before marking anything complete, deployed, or ready. Non-negotiable.
triggers: ["ship check", "before shipping", "quality check", "done check"]
---

# Ship Check

Run this before marking ANYTHING complete. No exceptions.

## For Code / Deployments

1. Does it work on the LIVE URL? (not local, not dev -- the actual deployed URL)
2. Test every route, form, button, and API endpoint manually
3. Check the browser console for errors
4. Check the network tab for failed requests
5. Test with real data, not test data
6. Verify auth flows (login, logout, protected routes)
7. Mobile check if user-facing

If anything fails: fix it, then run ship check again from step 1.

## For Copy / Content

1. Read it aloud -- does it sound human?
2. Does every sentence earn the next? (would you keep reading?)
3. Is the hook strong enough to stop a scroll?
4. Is there exactly ONE clear CTA?
5. Does it match the brand voice file? (`knowledge/client/brand-voice.md`)
6. Any AI clichés? ("game-changing", "revolutionary", "I hope this finds you well") -- delete them
7. Score it 1-10. Below 8: rewrite.

## For Research / Reports

1. Is every claim sourced?
2. Spot-check 3 data points manually
3. Does the summary actually answer the original question?
4. Is the output in the right location? (`workspace/artifacts/research/`)

## For Data Tasks

1. Spot-check 3 rows manually
2. Does the count match expectations?
3. Any nulls or unexpected values?

## Gate

Only after passing all relevant checks:
1. Log to hive mind
2. Mark complete
3. Report to owner

If you're not sure it's done -- it's not done.
