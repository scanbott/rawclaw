---
name: ai-watch
description: Daily automated AI space monitor. Scrapes Twitter/X accounts and GitHub releases for new tools, drops, and builds. Filters for relevance to [COMPANY_NAME] stack. Auto-runs steal on high-value items. Saves intel to knowledge vault and notifies Chris.
user-invocable: true
---

# AI Watch -- Automated AI Space Monitor

**Flow:** Check GitHub releases -> Scrape Twitter accounts -> Filter relevance -> Steal high-value items -> Save to vault -> Notify Chris

No pauses. Run end to end once triggered.

---

## Watchlist

### Twitter/X Accounts
- @AnthropicAI
- @alexalbert__
- @sama
- @karpathy
- @GregBrockman
- @swyx
- @simonw
- @levelsio
- @mattshumer_
- @bindureddy

### GitHub Repos (releases + recent commits)
- anthropics/anthropic-sdk-python
- anthropics/anthropic-sdk-typescript
- anthropics/anthropic-cookbook
- anthropics/claude-code (if exists, else search for it)
- anthropics/model-spec
- langchain-ai/langchain
- openai/openai-python
- microsoft/autogen
- crewAIInc/crewAI
- run-llama/llama_index

---

## Step 1: Load Previous Run State

Check when this last ran and what was already seen:

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
LAST_RUN_FILE="$PROJECT_ROOT/store/ai-watch-state.json"
if [ -f "$LAST_RUN_FILE" ]; then
  cat "$LAST_RUN_FILE"
else
  echo '{"last_run": null, "seen_items": []}'
fi
```

Load into memory: `last_run` timestamp and `seen_items` array of IDs/URLs already processed.

---

## Step 2: GitHub Releases (RSS -- No Auth Needed)

For each repo in the GitHub watchlist, fetch the releases RSS feed:

```
URL: https://github.com/{owner}/{repo}/releases.atom
```

Use WebFetch to retrieve each feed. Parse for entries released AFTER `last_run` (or in the last 24 hours if first run).

Extract per entry:
- `title` (release name + tag)
- `updated` (timestamp)
- `link` (release URL)
- `content` (release notes summary)

Also check for new repos from Anthropic specifically:
```
WebFetch: https://github.com/orgs/anthropics/repositories?sort=updated
```

Look for any repos updated in the last 24 hours.

---

## Step 3: Scrape Twitter/X Accounts

For each account in the watchlist, use browser automation:

**Approach A -- Direct Profile (try first):**
```javascript
// Navigate to profile
await page.goto('https://x.com/{username}');
// Wait for tweets to load
await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });
// Extract recent tweets
const tweets = await page.$$eval('[data-testid="tweet"]', tweets =>
  tweets.slice(0, 10).map(t => ({
    text: t.querySelector('[data-testid="tweetText"]')?.innerText || '',
    links: Array.from(t.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('http')),
    time: t.querySelector('time')?.getAttribute('datetime') || ''
  }))
);
```

**Approach B -- Nitter fallback (if X blocks):**
Try these nitter instances in order:
- `https://nitter.privacydev.net/{username}`
- `https://nitter.poast.org/{username}`
- `https://nitter.1d4.us/{username}`

WebFetch the nitter URL and parse the tweet list from HTML.

For each tweet:
- Skip if timestamp is more than 48 hours ago
- Skip if already in `seen_items`
- Extract any URLs (github links, product launches, tool announcements)

---

## Step 4: Filter for Relevance

Score each item (GitHub release or tweet) on relevance to [COMPANY_NAME]:

**HIGH (steal immediately):**
- New Anthropic model or Claude update
- New Claude Code feature or release
- New AI agent framework or SDK
- New automation tool relevant to our stack (n8n, Make, Zapier alternatives)
- Cool agent build or system architecture shared on Twitter
- New MCP server or tool
- New AI + business ops tool

**MEDIUM (save to vault, review later):**
- General AI news or trends
- Pricing or market changes
- New competitor products

**LOW (skip):**
- Retweets of old news
- Personal life tweets
- Irrelevant industry news

---

## Step 5: Steal High-Value Items

For each HIGH relevance item that has a URL:

1. Extract the primary URL (GitHub repo, product page, blog post)
2. Run the steal skill on it -- construct a message internally:
   > "rob this: {URL}"
3. The steal skill will extract everything useful and save/implement it

For tweet-only items (no URL), extract the key insight and write it directly to the vault.

---

## Step 6: Save Intel to Knowledge Vault

Write a dated report:

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
REPORT_FILE="$PROJECT_ROOT/knowledge/research/ai-watch-$(date +%Y-%m-%d).md"
```

Report format:
```markdown
# AI Watch Report -- {DATE}

## GitHub Releases
- [{repo}] {release title} -- {link}
  > {one-line summary of what changed}

## Twitter Signals
- [@{user}]: {tweet summary} -- {link if any}

## Items Stolen/Implemented
- {URL} -- {what was extracted/implemented}

## Skipped (Medium/Low)
- {brief list}
```

---

## Step 7: Update State File

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
python3 -c "
import json, time, os, subprocess

root = subprocess.check_output(['git', 'rev-parse', '--show-toplevel']).decode().strip()
state_file = os.path.join(root, 'store', 'ai-watch-state.json')

# Load existing
try:
    with open(state_file) as f:
        state = json.load(f)
except:
    state = {'last_run': None, 'seen_items': []}

# Update
state['last_run'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
# Add new seen items (pass as env var or hardcode list from this run)
seen_new = os.environ.get('SEEN_ITEMS', '').split(',')
state['seen_items'] = list(set(state['seen_items'] + [s for s in seen_new if s]))
# Keep last 500 items max
state['seen_items'] = state['seen_items'][-500:]

with open(state_file, 'w') as f:
    json.dump(state, f, indent=2)
print('State updated.')
"
```

---

## Step 8: Notify Chris

Send a Telegram message summarizing what was found:

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
bash "$PROJECT_ROOT/scripts/notify.sh" "AI Watch complete. {N} new items found. {X} stolen/implemented. Full report: knowledge/research/ai-watch-$(date +%Y-%m-%d).md"
```

If nothing new was found: "AI Watch: nothing new in the last 24hrs across {N} accounts and {M} repos."

---

## Step 9: Log to Hive Mind

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
CHAT_ID=$(sqlite3 "$PROJECT_ROOT/store/businessos.db" "SELECT chat_id FROM sessions LIMIT 1;")
sqlite3 "$PROJECT_ROOT/store/businessos.db" "INSERT INTO hive_mind (agent_id, chat_id, action, summary, created_at) VALUES ('ovi', '$CHAT_ID', 'ai_watch_run', 'AI Watch completed. Found N new items, stole X.', strftime('%s','now'));"
```
