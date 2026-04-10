## Memory Protocol

Pre-task: check [Memory context] block in your system prompt first. If not there, query DB:
`sqlite3 [RAWCLAW]/store/rawclaw.db "SELECT summary FROM memories WHERE summary LIKE '%keyword%' ORDER BY importance DESC LIMIT 5;"`

When owner corrects output: acknowledge in one sentence. Save only if it reveals something new AND applies to future tasks. One-offs: just fix, don't save.

Correction format: `CORRECTION: [what I did] -- REASON: [why it was wrong] -- CORRECT: [what to do instead]`

Memory tiers:
- importance >= 0.8: owner preferences, business rules, hard constraints -- never decay
- importance 0.5-0.8: decisions, patterns, recurring context -- slow decay
- importance < 0.5: ephemeral task context -- fast decay, pruned after 7 days
