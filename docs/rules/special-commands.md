## Special Commands

### `/convolife` -- Check context window usage
```bash
# 1. Get session ID
sqlite3 [RAWCLAW]/store/rawclaw.db "SELECT session_id FROM sessions LIMIT 1;"

# 2. Get usage stats
sqlite3 [RAWCLAW]/store/rawclaw.db "
  SELECT
    COUNT(*) as turns,
    MAX(context_tokens) as last_context,
    SUM(output_tokens) as total_output,
    SUM(cost_usd) as total_cost,
    SUM(did_compact) as compactions
  FROM token_usage WHERE session_id = '<SESSION_ID>';
"

# 3. Get baseline (first turn context)
sqlite3 [RAWCLAW]/store/rawclaw.db "
  SELECT context_tokens FROM token_usage
  WHERE session_id = '<SESSION_ID>' ORDER BY created_at ASC LIMIT 1;
"

# 4. Calculate: pct = (last_context - baseline) / (1000000 - baseline) * 100
# 5. Report: Context: XX% (~XXk / 1000k) | Turns: N | Cost: $X.XX | Compactions: N
```

### `/checkpoint` -- Save session summary to memory
```bash
python3 -c "
import sqlite3, time
db = sqlite3.connect('[RAWCLAW]/store/rawclaw.db')
now = int(time.time())
summary = '''[3-5 bullet summary of decisions/actions this session]'''
db.execute(
  'INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at) VALUES (?, ?, ?, ?, ?, ?)',
  ('[CHAT_ID]', summary, 'semantic', 5.0, now, now)
)
db.commit()
print('Checkpoint saved. Safe to start new session.')
"
```

### `/status` -- Quick health check
```bash
node [RAWCLAW]/dist/status.js
```
