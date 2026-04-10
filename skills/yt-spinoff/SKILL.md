---
name: yt-spinoff
description: Pull a YouTube video transcript, extract the framework and voice patterns, then rewrite it as a Rawgrowth YouTube script. Runs quality gate, saves to Google Doc, returns the link. Triggers on "/yt-spinoff [URL]", "spin off this video", "make our version of [URL]", or "remix this [URL]".
user-invocable: true
---

# YouTube Spinoff Pipeline

**Flow:** Pull Transcript -> Summarize + Extract Framework -> Rewrite as YouTube Script -> Quality Gate -> Google Doc -> Return Link

No pauses. No questions. Run end to end.

---

## Parse Input

Extract from user message:
- **YouTube URL** (required)

---

## Step 1: Pull Transcript

Run yt-dlp to grab auto-generated subtitles. Replace YOUTUBE_URL with the actual URL:

```bash
source /Users/scanbot/BusinessOS/.env
yt-dlp --write-auto-sub --sub-lang en --skip-download --output "/tmp/yt_spinoff_%(id)s" "YOUTUBE_URL"
```

Find and clean the subtitle file:
```bash
SUBFILE=$(ls /tmp/yt_spinoff_*.vtt /tmp/yt_spinoff_*.srt 2>/dev/null | head -1)
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
```

Get video title:
```bash
yt-dlp --get-title "YOUTUBE_URL"
```

**Fallback if no subtitles:** Download audio and transcribe via Gemini (GOOGLE_API_KEY from .env):
```bash
yt-dlp --extract-audio --audio-format mp3 --output "/tmp/yt_audio_%(id)s.%(ext)s" "YOUTUBE_URL"
```
Then use Gemini Files API to upload and transcribe.

---

## Step 2: Summarize and Extract Framework

From the full transcript, extract:

**Summary (3-5 sentences):** What does this video actually teach?

**Framework (the skeleton you will rewrite):**
- Hook type: how does it open? (stat, story, question, bold claim, pattern interrupt?)
- Beat structure: what are the main sections and what does each accomplish?
- Pacing: punchy and fast, or deep and slow?
- Signature moves: any structural phrases, rhetorical patterns, or transitions they repeat?
- CTA approach: how do they close and what action do they drive?
- Proof style: data, story, demonstration, or authority?

Write this out before touching the script.

---

## Step 3: Load Brand Voice

Read marketing/brand/VOICE.md. Internalize before writing a single word.

---

## Step 4: Write the Rawgrowth YouTube Script

Apply the extracted framework to Rawgrowth content. Same skeleton, completely different words.

**Context:**
- ICP: $3M-$15M consultants and agency owners
- Offer: $20K install + $10K/mo retainer
- The system: custom dashboard, trained agents, connected to everything
- Proof: real client results, real numbers

**Script structure:**
- Hook (0-15s): match the hook type from original
- Intro (15s-60s): who this is for, what they will learn
- Main content: follow the beat structure section by section
- Proof point: real client result woven in naturally
- CTA: single clear ask

**Voice rules:**
- Contractions always
- No em dashes. Periods or "..." instead.
- Engineering verbs: install, deploy, build, plug in, productize
- Never: game-changer, unlock, leverage, utilize, deep dive, revolutionary
- Peer-to-peer. Real numbers. No hype.

---

## Step 5: Quality Gate

### 5a. Banned Construction Scan (run first)

Scan entire script. Rewrite any line containing:
- "X isn't X, it's Y" or "It's not [thing], it's [thing]"
- "Not A, not B, not C -- it's [thing]"
- "You're not X, Y, Z. You are A, B, C"
- "Stop doing X. Start doing Y."
- "Less X. More Y."

Rewrite from scratch. Not a patch.

### 5b. Score
- Voice Match (1-5)
- Specificity (1-5)
- Originality (1-5)
- Concision (1-5)

Minimum 3/5 on all. Rewrite failures, rescore.

---

## Step 6: Create Google Doc

Use the Google Docs API. Auth via credentials in .env or application-default.

Doc title: "YT Spinoff: {VIDEO_TITLE} -- {DATE}"

Doc structure:
```
YT SPINOFF: [VIDEO TITLE]
Source: [URL]
Date: [DATE]

FRAMEWORK EXTRACTED
[Beat-by-beat breakdown of source structure]

---

RAWGROWTH SCRIPT
[Full rewritten script]
```

Create and share (anyone with link can view):
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
    body={"requests": [{"insertText": {"location": {"index": 1}, "text": CONTENT}}]}
).execute()

drive.permissions().create(fileId=doc_id, body={"type": "anyone", "role": "reader"}).execute()
print(f"https://docs.google.com/document/d/{doc_id}")
```

**Fallback if API fails:** Save to /Users/scanbot/BusinessOS/workspace/content/spinoffs/{video-id}-{date}.md and give Chris the file path.

---

## Step 7: Deliver and Cleanup

Return to Chris:
- Google Doc link
- One sentence: what framework you extracted from the source

Cleanup temp files:
```bash
rm -f /tmp/yt_spinoff_* /tmp/yt_audio_*
```

---

## Error Handling

| Problem | Solution |
|---------|----------|
| yt-dlp missing | pip3 install yt-dlp --break-system-packages |
| No subtitles | Fall back to audio + Gemini transcription |
| Private/unavailable video | Tell Chris, stop |
| Google Docs API auth fails | Save locally, give file path |
| Output dir missing | mkdir -p /Users/scanbot/BusinessOS/workspace/content/spinoffs/ |
