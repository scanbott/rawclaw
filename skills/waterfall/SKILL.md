---
name: waterfall
description: Drop a YouTube URL, your own video link, or a concept. Pulls transcript if video, then generates 5 YouTube video ideas, 1 LinkedIn post, 1 X thread, and 5 Instagram reel scripts -- all in Chris's voice. Saves everything to one Google Doc and returns the link. Triggers on "/waterfall", "waterfall this", "waterfall [URL]", or "make content from [URL or concept]".
user-invocable: true
context: fork
---

# Waterfall Content Pipeline

**Flow:** Get Input -> Pull Transcript (if video) -> Extract Themes -> Load Brand Voice -> Generate All Outputs -> Quality Gate -> Google Doc -> Return Link

No pauses. Run end to end.

---

## Parse Input

Extract from user message:
- **Input:** YouTube URL, or a concept/text idea
- If URL: go to Step 1 to pull transcript
- If concept/text: skip Step 1, use the concept directly as raw material in Step 2

---

## Step 1: Pull Transcript (skip if input is a concept)

```bash
source /Users/scanbot/BusinessOS/.env
yt-dlp --write-auto-sub --sub-lang en --skip-download --output "/tmp/waterfall_%(id)s" "YOUTUBE_URL"
SUBFILE=$(ls /tmp/waterfall_*.vtt /tmp/waterfall_*.srt 2>/dev/null | head -1)
python3 - "$SUBFILE" <<'PY'
import re, sys
with open(sys.argv[1]) as f:
    raw = f.read()
lines = raw.split("\n")
clean = []
for line in lines:
    line = line.strip()
    if not line or line.startswith("WEBVTT") or re.match(r"[0-9]+:[0-9]+", line) or "-->" in line:
        continue
    line = re.sub(r"<[^>]+>", "", line)
    if line and (not clean or line != clean[-1]):
        clean.append(line)
print(" ".join(clean))
PY
yt-dlp --get-title "YOUTUBE_URL"
```

**Fallback if no subtitles:** Download audio, transcribe via Gemini (GOOGLE_API_KEY from .env).

---

## Step 2: Extract Core Themes

From the transcript or concept, pull:
- The central insight or main idea
- 3-5 sub-themes or angles within it
- Any specific proof points, numbers, or examples
- Who the primary audience is

This is the raw material for all outputs.

---

## Step 3: Load Brand Voice

Read marketing/brand/VOICE.md. Apply to every output below.

**Voice rules (non-negotiable for all outputs):**
- Contractions always
- No em dashes. Periods or "..." instead.
- Engineering verbs: install, deploy, build, plug in, productize
- Never: game-changer, unlock, leverage, utilize, deep dive, revolutionary, certainly
- Peer-to-peer. Real numbers. Proof over promise.
- ICP throughout: $3M-$15M consultants and agency owners

---

## Step 4: Generate All Outputs

### OUTPUT 1: 5 YouTube Video Ideas

For each idea:
- **Title:** specific, punchy, searchable
- **Hook:** first 15 seconds, word for word
- **Angle:** what makes this take different from the obvious one
- **Format:** talking head / screen recording / walkthrough / case study

Cover different angles. One should be a close spinoff of the source. Others should be derivative ideas sparked by it.

---

### OUTPUT 2: LinkedIn Post

- Line 1: scroll-stopper hook. No fluff.
- Body: 3-5 short paragraphs. Each one earns the next.
- Close: one clear takeaway or soft CTA
- Under 1,300 characters
- Max 2 hashtags (or none)

---

### OUTPUT 3: X / Twitter Thread

5-8 tweets:
- Tweet 1: bold hook or stat. Standalone. Makes them keep reading.
- Tweets 2-6: one point each. Short. No padding.
- Final tweet: summary, CTA, or "full breakdown on LinkedIn"

Number each tweet. Max 280 chars each.

---

### OUTPUT 4: 5 Instagram Reel Scripts

For each reel:
- **Hook line:** first 3 seconds. On-screen text + what Chris says.
- **Script:** what Chris says, broken into short punchy lines, 30-60 seconds
- **Visual note:** what to show on screen (dashboard, phone, face cam, screen recording?)
- **CTA:** what to say at the end

Each reel = different angle on the core theme. Fast pacing. No long explanations.

---

## Step 5: Quality Gate (runs on all outputs)

### 5a. Banned Construction Scan

Scan every output. Rewrite any line containing:
- "X isn't X, it's Y" or "It's not [thing], it's [thing]"
- "Not A, not B, not C -- it's [thing]"
- "You're not X, Y, Z. You are A, B, C"
- "Stop doing X. Start doing Y."
- "Less X. More Y."

Zero tolerance. Rewrite from scratch, not a patch.

### 5b. Score each output
- Voice Match (1-5)
- Specificity (1-5)
- Originality (1-5)
- Concision (1-5)

Minimum 3/5 on all. Rewrite failures before saving.

---

## Step 6: Create Google Doc

One doc, all outputs clearly sectioned.

Doc title: "Waterfall: {SOURCE_TITLE} -- {DATE}"

Doc structure:
```
WATERFALL OUTPUT
Source: [URL or concept summary]
Date: [DATE]

---
5 YOUTUBE IDEAS
[Idea 1 -- Title / Hook / Angle / Format]
[Idea 2]
[Idea 3]
[Idea 4]
[Idea 5]

---
LINKEDIN POST
[Full post]

---
X / TWITTER THREAD
Tweet 1: ...
Tweet 2: ...
...

---
5 INSTAGRAM REEL SCRIPTS
[Reel 1 -- Hook / Script / Visual / CTA]
[Reel 2]
[Reel 3]
[Reel 4]
[Reel 5]
```

Create and share via Google Docs API:
```python
from googleapiclient.discovery import build
from google.auth import default

creds, _ = default(scopes=["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"])
docs = build("docs", "v1", credentials=creds)
drive = build("drive", "v3", credentials=creds)

doc = docs.documents().create(body={"title": TITLE}).execute()
doc_id = doc["documentId"]

docs.documents().batchUpdate(
    documentId=doc_id,
    body={"requests": [{"insertText": {"location": {"index": 1}, "text": FULL_CONTENT}}]}
).execute()

drive.permissions().create(fileId=doc_id, body={"type": "anyone", "role": "reader"}).execute()
print(f"https://docs.google.com/document/d/{doc_id}")
```

**Fallback if API fails:** Save to /Users/scanbot/BusinessOS/workspace/content/waterfall/{source-slug}-{date}.md and return file path.

---

## Step 7: Deliver and Cleanup

Return to Chris:
- Google Doc link
- One line: "Waterfall from [source]. 5 YT ideas, LinkedIn post, X thread, 5 reel scripts."

Cleanup:
```bash
rm -f /tmp/waterfall_*
```

---

## Error Handling

| Problem | Solution |
|---------|----------|
| yt-dlp missing | pip3 install yt-dlp --break-system-packages |
| No subtitles | Fall back to audio + Gemini transcription |
| Private/unavailable video | Tell Chris, stop |
| Input is a concept (no URL) | Skip transcript step entirely, use concept text as Step 2 input |
| Google Docs API fails | Save locally, return file path |
| Output dir missing | mkdir -p /Users/scanbot/BusinessOS/workspace/content/waterfall/ |
